package dz.radbalek.rad_balek

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.ContactsContract
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var pickResult: MethodChannel.Result? = null
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "rb/channels").setMethodCallHandler { call, result ->
            when (call.method) {
                "openChannel" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startActivity(Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                        putExtra(Settings.EXTRA_CHANNEL_ID, call.argument<String>("id"))
                    })
                    result.success(true)
                } else result.notImplemented()
                "openAppNotif" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, packageName))
                    result.success(true)
                } else result.notImplemented()
                // Grant Do-Not-Disturb access so red alerts bypass DND/silent.
                "requestDndAccess" -> {
                    startActivity(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS))
                    result.success(true)
                }
                // OnePlus/OxygenOS kills background FCM — ask to exempt from battery opt.
                "requestBatteryExempt" -> {
                    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
                    if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                        startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName")))
                    }
                    result.success(true)
                }
                "openChannelEmergency" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startActivity(Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                        putExtra(Settings.EXTRA_CHANNEL_ID, "emergency_s2")
                    })
                    result.success(true)
                } else result.notImplemented()
                // System contact picker (ACTION_PICK): needs NO contacts
                // permission — the picker grants read access to the one row
                // the user chooses.
                "pickContact" -> {
                    try {
                        pickResult?.success(null) // cancel a stale pending pick
                        pickResult = result
                        startActivityForResult(
                            Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI), 7001)
                    } catch (e: Exception) {
                        pickResult = null
                        android.util.Log.w("RBSIREN", "pickContact failed: ${e.message}")
                        result.success(null)
                    }
                }
                // Direct call for personal SOS contacts. Official short codes
                // go to the dialer (Android forbids ACTION_CALL to emergency
                // numbers anyway); first personal use asks for CALL_PHONE.
                // Always ACTION_DIAL — no CALL_PHONE permission (dropped for Play).
                // The number is pre-filled in the dialer; one tap connects. Works
                // for official short codes (14/17/1055) and personal SOS alike.
                "directCall" -> {
                    val num = call.argument<String>("number") ?: ""
                    try {
                        startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$num")))
                        result.success(true)
                    } catch (e: Exception) {
                        // Reported as an error, not success(false): the Dart side
                        // awaits this call and only its CATCH runs the url_launcher
                        // fallback, so a plain false meant the user pressed an
                        // emergency number and no dialer ever opened.
                        android.util.Log.w("RBSIREN", "directCall failed: ${e.message}")
                        result.error("dial_failed", e.message, null)
                    }
                }
                // Full reliability picture for the Fiabilité checklist: every
                // switch an OEM or the user can silently flip that would keep
                // a red alert from ringing.
                "emergencyStatus" -> {
                    val nm = getSystemService(NotificationManager::class.java)
                    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
                    val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
                    val channelOk = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val ch = nm.getNotificationChannel("emergency_s2")
                        ch != null && ch.importance != NotificationManager.IMPORTANCE_NONE
                    } else true
                    val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
                    val vol = if (maxVol > 0) am.getStreamVolume(AudioManager.STREAM_ALARM).toDouble() / maxVol else 1.0
                    result.success(mapOf(
                        "notifs" to nm.areNotificationsEnabled(),
                        "channel" to channelOk,
                        "battery" to pm.isIgnoringBatteryOptimizations(packageName),
                        "dnd" to (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || nm.isNotificationPolicyAccessGranted),
                        "volume" to vol,
                        // Android 14+ gates full-screen intents behind an appop
                        // that is DENIED by default for non-alarm apps. Without
                        // it the red lockscreen takeover degrades to a banner
                        // and the AR/FR announcement (which lives in
                        // AlertActivity) never runs. Upgrades keep the old
                        // grant, fresh installs may not — so each phone must
                        // report its own state instead of us guessing.
                        "fsi" to (Build.VERSION.SDK_INT < 34 || nm.canUseFullScreenIntent())
                    ))
                }
                "openSoundSettings" -> {
                    // Same rule as directCall: a settings page that never opened
                    // must not be reported as opened, or the user keeps tapping a
                    // button that does nothing.
                    try {
                        startActivity(Intent(Settings.ACTION_SOUND_SETTINGS))
                        result.success(true)
                    } catch (e: Exception) {
                        android.util.Log.w("RBSIREN", "openSoundSettings failed: ${e.message}")
                        result.error("no_activity", e.message, null)
                    }
                }
                // Android 14+ settings page where the user grants full-screen
                // alerts to this app.
                "requestFsi" -> {
                    if (Build.VERSION.SDK_INT >= 34) {
                        try {
                            startActivity(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                                Uri.parse("package:$packageName")))
                            result.success(true)
                        } catch (e: Exception) {
                            // Per-app page missing on this OEM: fall back to the
                            // global one, and report failure if that is gone too.
                            try {
                                startActivity(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT))
                                result.success(true)
                            } catch (e2: Exception) {
                                android.util.Log.w("RBSIREN", "requestFsi failed: ${e2.message}")
                                result.error("no_activity", e2.message, null)
                            }
                        }
                    } else result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != 7001) return
        val res = pickResult ?: return
        pickResult = null
        val uri = data?.data
        if (resultCode != RESULT_OK || uri == null) { res.success(null); return }
        try {
            contentResolver.query(uri,
                arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER,
                        ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME),
                null, null, null)?.use { c ->
                if (c.moveToFirst()) {
                    res.success(mapOf("number" to (c.getString(0) ?: ""), "name" to (c.getString(1) ?: "")))
                    return
                }
            }
            res.success(null)
        } catch (e: Exception) {
            android.util.Log.w("RBSIREN", "contact lookup failed: ${e.message}")
            res.success(null)
        }
    }

    // Numeric-ID URIs: the release optimizer obfuscates resource NAMES, so
    // name-based android.resource://…/raw/rb_high URIs silently resolve to
    // nothing. Compile-time R ids survive obfuscation.
    private fun rawUri(id: Int) = Uri.parse("android.resource://$packageName/$id")

    override fun onResume() {
        super.onResume()
        RbMessagingService.stopSiren() // user opened the app — stop the wail
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NotificationManager::class.java)
            // Android restores a deleted channel's user-locked sound on recreate
            // (anti-abuse), so tiered sirens need FRESH channel ids (…_s2 —
            // the _s1 generation stored name-based sound URIs that the release
            // build can no longer resolve).
            for (id in listOf("red_alerts", "emergency", "orange_alerts", "yellow_alerts",
                              "emergency_s1", "orange_s1", "yellow_s1", "allclear")) {
                nm.deleteNotificationChannel(id)
            }
            val notif = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
            // RED channel — single source of truth in RbMessagingService, so the
            // service can also create it if a red lands before the app is opened.
            RbMessagingService.ensureRedChannel(this)
            // ORANGE — ascending warning tone.
            nm.createNotificationChannel(
                NotificationChannel("orange_s2", "Vigilance orange — تحذير برتقالي", NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Alertes oranges — ONM"
                    enableVibration(true)
                    setSound(rawUri(R.raw.rb_med), notif)
                }
            )
            // YELLOW — soft chime (low intrusion).
            nm.createNotificationChannel(
                NotificationChannel("yellow_s2", "Vigilance jaune — تحذير أصفر", NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Alertes jaunes — ONM"
                    setSound(rawUri(R.raw.rb_low), notif)
                }
            )
            // GREEN — warm all-clear shimmer.
            nm.createNotificationChannel(
                NotificationChannel("allclear_s2", "Fin d'alerte — انتهاء التحذير", NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Retour à la normale"
                    setSound(rawUri(R.raw.rb_clear), notif)
                }
            )
        }
    }
}
