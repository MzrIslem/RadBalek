package dz.radbalek.rad_balek

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import io.flutter.plugins.firebase.messaging.FlutterFirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/// Red alerts arrive as DATA-ONLY messages and are displayed HERE, natively —
/// because a notification-channel sound is only a suggestion that OEMs
/// (OxygenOS in particular) freely suppress in silent mode. This service:
///   1. raises the ALARM stream volume if it's too low (life-safety override),
///   2. posts an insistent, full-screen, alarm-category notification that
///      wakes the screen over the lockscreen and loops the siren until seen.
/// Extends the FlutterFire service (with super calls) so Dart-side delivery —
/// foreground onMessage, token refresh — keeps working unchanged.
class RbMessagingService : FlutterFirebaseMessagingService() {

    companion object {
        private var player: MediaPlayer? = null
        private val handler = Handler(Looper.getMainLooper())

        /// Single source of truth for the RED siren channel. It used to be
        /// created ONLY in MainActivity.onCreate, so a red arriving after an app
        /// update / clear-data but BEFORE the app was next opened made notify()
        /// throw ("No channel found") → no full-screen face. Idempotent: Android
        /// ignores a re-create and never mutates an existing channel, so calling
        /// this from both showRed() and MainActivity is safe.
        fun ensureRedChannel(ctx: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val nm = ctx.getSystemService(NotificationManager::class.java)
            if (nm.getNotificationChannel("emergency_s2") != null) return
            val alarm = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
            // Numeric R id (not a name-based URI): the release build obfuscates
            // resource names, so android.resource://…/raw/rb_high resolves to
            // nothing — only compile-time ids survive.
            nm.createNotificationChannel(
                NotificationChannel("emergency_s2", "Alerte rouge — تحذير أحمر", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Alertes vitales — sirène, sonne même en silencieux (ONM)"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 700)
                    enableLights(true)
                    setBypassDnd(true)
                    setSound(Uri.parse("android.resource://${ctx.packageName}/${R.raw.rb_high}"), alarm)
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                }
            )
        }

        /// Called from MainActivity.onResume — opening the app stops the wail.
        /// stop() and release() MUST be in separate try blocks: stop() throws
        /// IllegalStateException if the player is still preparing (which is
        /// exactly what happens when AlertActivity launches and calls this
        /// mid-prepareAsync). Sharing one try skipped release() while the
        /// reference was dropped, leaving a looping alarm-stream siren that no
        /// code could ever reach — only a force-stop silenced it, and a
        /// force-stop breaks FCM delivery on Xiaomi/Oppo.
        fun stopSiren() {
            handler.removeCallbacksAndMessages(null)
            val p = player
            player = null
            try { p?.setOnPreparedListener(null) } catch (_: Exception) {}
            try { p?.stop() } catch (_: Exception) {}
            try { p?.release() } catch (_: Exception) {}
        }
    }

    override fun onMessageReceived(msg: RemoteMessage) {
        try {
            val d = msg.data
            // Gate on kind as well as colour. The 3-hourly "toujours actif"
            // heartbeat carries color:"red" (push.js) but is meant to be
            // non-intrusive; colour alone made it force alarm volume to 80% and
            // re-fire the siren + lockscreen takeover up to 4x per alert
            // whenever the app was in the foreground — which is precisely when
            // people keep it open during a red alert. Testers who get screamed
            // at turn notifications off, and then miss the real one.
            val kind = d["kind"] ?: "alert"
            if (d["color"] == "red" && (kind == "alert" || kind == "self-test")) showRed(d)
        } catch (e: Throwable) {
            // Red is data-only: nothing else will display it, so a swallowed
            // failure here is an alert that vanishes without a trace. Log it.
            android.util.Log.e("RBSIREN", "showRed failed", e)
        }
        super.onMessageReceived(msg) // Dart side (refresh, voice, banner)
    }

    private fun showRed(d: Map<String, String>) {
        val title = d["headline_fr"] ?: "🔴 Alerte rouge — رد بالك"
        val body = d["headline_ar"] ?: "اتبعوا التعليمات — Suivez les consignes"
        ensureRedChannel(this) // create the channel if the app hasn't run since install/update

        // 1) Defeat "alarm volume at zero": raise, never lower. RED only.
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            if (am.getStreamVolume(AudioManager.STREAM_ALARM) < (max * 0.6).toInt()) {
                am.setStreamVolume(AudioManager.STREAM_ALARM, (max * 0.8).toInt(), 0)
            }
        } catch (_: Exception) {}

        // 2) Full-screen intent → the dedicated AlertActivity (NOT the whole
        // app). Over the lockscreen the system launches it directly; that
        // activity shows the ALERT face and owns the siren.
        val isEew = d["eew"] == "true"
        val alertIntent = Intent(this, AlertActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            .putExtra("title", if(isEew) "⚡ SECOUSSE ESTIMÉE — ${d["warningSeconds"]?:"?"}s" else title)
            .putExtra("body", if(isEew) "M${d["mag"]?:"?"} à ~${d["distanceKm"]?:"?"}km — arrivée estimée des secousses dans ${d["warningSeconds"]?:"?"}s — Baissez-vous, couvrez-vous, tenez bon / انبطح واحتمي" else body)
            .putExtra("where", d["wilayas"]?.takeIf { it.isNotBlank() }?.let { "Wilaya(s): $it" } ?: "")
            .putExtra("alertId", d["alertId"] ?: "red")
            .putExtra("spoken_fr", if(isEew) (d["spoken_fr"] ?: "Secousse estimée dans ${d["warningSeconds"]?:"?"} secondes — baissez-vous, couvrez-vous, tenez bon") else (d["spoken_fr"] ?: title))
            .putExtra("spoken_ar", if(isEew) (d["spoken_ar"] ?: "هزة متوقعة خلال ${d["warningSeconds"]?:"?"} ثانية — انبطح واحتمي") else (d["spoken_ar"] ?: body))
            .putExtra("isEew", isEew)
            .putExtra("warningSeconds", d["warningSeconds"]?.toIntOrNull() ?: 0)
            .putExtra("pWaveSeconds", d["pWaveSeconds"]?.toIntOrNull() ?: 0)
            .putExtra("sWaveSeconds", d["sWaveSeconds"]?.toIntOrNull() ?: 0)
        val fsi = PendingIntent.getActivity(
            this, 1001, alertIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        // 2b) ALWAYS start the siren here. A background startActivity is blocked
        // by Android 14+ BAL *without throwing* (silent no-op), so the activity
        // can never be trusted to make the noise. The full-screen intent below
        // brings up AlertActivity when the device is locked, and its onCreate
        // calls stopSiren() before taking over — so there is never a double.
        startFallbackSiren()

        val n = NotificationCompat.Builder(this, "emergency_s2")
            .setSmallIcon(R.drawable.ic_stat_rb)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(fsi)
            .setFullScreenIntent(fsi, true)
            .build()
        // 3) Loop the siren until the user reacts (alarm-clock behavior).
        n.flags = n.flags or Notification.FLAG_INSISTENT
        try {
            getSystemService(NotificationManager::class.java)
                .notify((d["alertId"] ?: "red").hashCode(), n)
            android.util.Log.i("RBSIREN", "notification posted (full-screen intent armed)")
        } catch (e: Exception) {
            android.util.Log.e("RBSIREN", "notify failed: ${e.message}")
        }
    }

    /// Siren from the service — only when AlertActivity couldn't start, so the
    /// phone still wails. MediaPlayer on the ALARM stream (not ringer-affected).
    private fun startFallbackSiren() {
        try {
            stopSiren()
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            mp.setDataSource(this, android.net.Uri.parse("android.resource://$packageName/${R.raw.rb_high}"))
            mp.isLooping = true
            mp.setOnPreparedListener { it.start(); android.util.Log.i("RBSIREN", "fallback siren STARTED") }
            mp.setOnErrorListener { _, w, e -> android.util.Log.e("RBSIREN", "fallback err $w/$e"); false }
            mp.prepareAsync()
            player = mp
            handler.postDelayed({ stopSiren() }, 30_000)
        } catch (e: Exception) {
            android.util.Log.e("RBSIREN", "fallback siren failed: ${e.message}")
        }
    }
}
