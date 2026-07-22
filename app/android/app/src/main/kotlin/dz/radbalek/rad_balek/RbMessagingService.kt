package dz.radbalek.rad_balek

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
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

        /// Called from MainActivity.onResume — opening the app stops the wail.
        fun stopSiren() {
            handler.removeCallbacksAndMessages(null)
            try {
                player?.stop()
                player?.release()
            } catch (_: Exception) {}
            player = null
        }
    }

    override fun onMessageReceived(msg: RemoteMessage) {
        try {
            val d = msg.data
            if (d["color"] == "red") showRed(d)
        } catch (_: Exception) {}
        super.onMessageReceived(msg) // Dart side (refresh, voice, banner)
    }

    private fun showRed(d: Map<String, String>) {
        val title = d["headline_fr"] ?: "🔴 Alerte rouge — رد بالك"
        val body = d["headline_ar"] ?: "اتبعوا التعليمات — Suivez les consignes"

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
        val alertIntent = Intent(this, AlertActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            .putExtra("title", title)
            .putExtra("body", body)
            .putExtra("where", d["wilayas"]?.takeIf { it.isNotBlank() }?.let { "Wilaya(s): $it" } ?: "")
            .putExtra("alertId", d["alertId"] ?: "red")
            .putExtra("spoken_fr", d["spoken_fr"] ?: title)
            .putExtra("spoken_ar", d["spoken_ar"] ?: body)
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
