package dz.radbalek.rad_balek

import android.animation.ObjectAnimator
import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/// Full-screen RED-alert takeover shown OVER the lockscreen (not the app).
/// Owns the siren via MediaPlayer on the ALARM stream + audio focus, so it
/// rings even in silent/vibrate (alarm stream is not ringer-affected). Native,
/// so it appears instantly with no Flutter engine spin-up.
class AlertActivity : Activity() {
    private var player: MediaPlayer? = null
    private var focus: AudioFocusRequest? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        RbMessagingService.stopSiren() // one siren source — this activity owns it now
        showOverLockscreen()

        val title = intent.getStringExtra("title") ?: "🔴 ALERTE ROUGE"
        val body = intent.getStringExtra("body") ?: "Suivez les consignes des autorités."
        val where = intent.getStringExtra("where") ?: ""

        setContentView(buildUi(title, body, where))
        startSiren()
        vibrate()
    }

    private fun showOverLockscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true); setTurnScreenOn(true)
            (getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun dp(v: Int) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

    private fun buildUi(title: String, body: String, where: String): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#B3120E"))
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(48), dp(28), dp(40))
        }
        fun label(t: String, size: Int, bold: Boolean, alpha: Int = 255) = TextView(this).apply {
            text = t; setTextColor(Color.argb(alpha, 255, 255, 255))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, size.toFloat())
            gravity = Gravity.CENTER
            if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        val siren = label("🔴", 64, false)
        ObjectAnimator.ofFloat(siren, "alpha", 1f, 0.25f).apply {
            duration = 600; repeatMode = ObjectAnimator.REVERSE; repeatCount = ObjectAnimator.INFINITE; start()
        }
        root.addView(siren)
        root.addView(label(title, 26, true).apply { setPadding(0, dp(14), 0, 0) })
        if (where.isNotEmpty()) root.addView(label(where, 17, false, 230).apply { setPadding(0, dp(6), 0, 0) })
        root.addView(label(body, 16, false, 230).apply { setPadding(0, dp(12), 0, dp(28)) })

        fun bigBtn(text: String, bg: String, fg: String, onClick: () -> Unit) = Button(this).apply {
            this.text = text
            setTextColor(Color.parseColor(fg)); setBackgroundColor(Color.parseColor(bg))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(58))
            lp.topMargin = dp(10); layoutParams = lp
            setOnClickListener { onClick() }
        }
        root.addView(bigBtn("📞  APPELER LE 14", "#FFFFFF", "#B3120E") {
            startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:14")))
        })
        root.addView(bigBtn("Voir les consignes", "#7A0C0A", "#FFFFFF") {
            stopAll()
            startActivity(Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            finish()
        })
        root.addView(bigBtn("Arrêter la sirène", "#7A0C0A", "#FFDAD6") { stopAll(); finish() })
        return root
    }

    private fun startSiren() {
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val max = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            val cur = am.getStreamVolume(AudioManager.STREAM_ALARM)
            Log.i("RBSIREN", "alarm vol $cur/$max ringerMode=${am.ringerMode}")
            if (cur < (max * 0.6).toInt()) am.setStreamVolume(AudioManager.STREAM_ALARM, (max * 0.85).toInt(), 0)

            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(attrs).build()
                am.requestAudioFocus(focus!!)
            }
            val mp = MediaPlayer()
            mp.setAudioAttributes(attrs)
            mp.setDataSource(this, Uri.parse("android.resource://$packageName/${R.raw.rb_high}"))
            mp.isLooping = true
            mp.setOnPreparedListener { it.start(); Log.i("RBSIREN", "MediaPlayer STARTED on alarm stream") }
            mp.setOnErrorListener { _, w, e -> Log.e("RBSIREN", "MediaPlayer error $w/$e"); false }
            mp.prepareAsync()
            player = mp
        } catch (e: Exception) {
            Log.e("RBSIREN", "startSiren failed: ${e.message}")
        }
    }

    private fun vibrate() {
        try {
            val v = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            val pat = longArrayOf(0, 600, 300, 600, 300, 800)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                v.vibrate(VibrationEffect.createWaveform(pat, 0))
            else @Suppress("DEPRECATION") v.vibrate(pat, 0)
        } catch (_: Exception) {}
    }

    private fun stopAll() {
        try { player?.stop(); player?.release() } catch (_: Exception) {}
        player = null
        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            focus?.let { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) am.abandonAudioFocusRequest(it) }
        } catch (_: Exception) {}
        try { (getSystemService(Context.VIBRATOR_SERVICE) as Vibrator).cancel() } catch (_: Exception) {}
    }

    override fun onDestroy() { stopAll(); super.onDestroy() }
}
