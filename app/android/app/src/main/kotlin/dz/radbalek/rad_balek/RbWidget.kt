package dz.radbalek.rad_balek

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.color.DayNightColorProvider
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import es.antonborri.home_widget.HomeWidgetGlanceState
import es.antonborri.home_widget.HomeWidgetGlanceStateDefinition
import es.antonborri.home_widget.HomeWidgetGlanceWidgetReceiver
import es.antonborri.home_widget.actionStartActivity

/**
 * Home-screen vigilance widget (arc 3.5): RAD BALEK status at a glance.
 *
 * Data flow: Dart (main.dart listens on AppState → lib/src/widget_feed.dart)
 * projects my-wilayas status into the HomeWidgetPreferences file via
 * home_widget, then updateWidget(androidName:"RbWidgetReceiver") broadcasts
 * APPWIDGET_UPDATE — the receiver redraws from those prefs. A workmanager
 * 30-min fallback re-projects from a fresh lite fetch (or the offline cache)
 * so the widget stays honest when the app hasn't been opened. The widget
 * itself NEVER fetches: updatePeriodMillis=0 and no network code here — a
 * widget must not wake the radio on its own schedule, and red alerts arrive
 * through FCM regardless of what the widget shows.
 *
 * Degradation rule: level=-1 (Dart never wrote prefs — fresh install, or
 * the widget was pinned before the app ever opened) renders the honest
 * "open the app" state, NEVER a fabricated green. A green "all clear" shown
 * without data would be a life-safety lie.
 *
 * Contract with lib/src/widget_feed.dart (keep keys in sync):
 *   wb_level     Int    -1 no-data | 0 calm | 1 yellow | 2 orange | 3 red
 *   wb_title     String headline in the APP language (localized by Dart)
 *   wb_sub       String wilaya names at the top level, " · "-joined
 *   wb_hazard    String hazard key ('heat'…) — drives the glyph, "" if none
 *   wb_national  Int    redWilayas*100 + orangeWilayas (58 wilayas max, so
 *                        base-100 packs both without collision)
 *   wb_updated   String "HH:mm" — when this projection was rendered
 *   wb_lang      String 'fr' | 'en' | 'ar' (drives copy + text alignment)
 */
class RbWidget : GlanceAppWidget() {

    // One layout sized by the launcher (4x2 target, min 250x110dp): a widget
    // this simple gains nothing from breakpoint layouts, and a single
    // render path keeps the first draw predictable on cheap launchers.
    override val sizeMode = SizeMode.Single

    // home_widget's state definition: prefs live in "HomeWidgetPreferences"
    // and updates via Dart's HomeWidget.updateWidget() flow through it.
    override val stateDefinition = HomeWidgetGlanceStateDefinition()

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            val prefs = currentState<HomeWidgetGlanceState>().preferences
            WidgetBody(
                context = context,
                level = prefs.getInt("wb_level", -1),
                title = prefs.getString("wb_title", null),
                sub = prefs.getString("wb_sub", null),
                hazard = prefs.getString("wb_hazard", null),
                national = prefs.getInt("wb_national", -1),
                updated = prefs.getString("wb_updated", null),
                lang = prefs.getString("wb_lang", "fr") ?: "fr",
            )
        }
    }

    /**
     * Container/on-container pairs mirror theme.dart's Vigilance light/dark
     * values exactly — hardcoded hexes because GlanceTheme's material3
     * mapping drifts across glance versions while the widget must read as
     * the same product as the app. DayNightColorProvider follows the
     * launcher's system theme automatically.
     */
    private class Pal(val bg: DayNightColorProvider, val fg: DayNightColorProvider)

    private fun pal(dayBg: Long, nightBg: Long, dayFg: Long, nightFg: Long) = Pal(
        DayNightColorProvider(Color(dayBg), Color(nightBg)),
        DayNightColorProvider(Color(dayFg), Color(nightFg)),
    )

    private val redPal = pal(
        dayBg = 0xFFFFDAD6, nightBg = 0xFF7B1712,
        dayFg = 0xFF73100E, nightFg = 0xFFFFDAD6,
    )
    private val orangePal = pal(
        dayBg = 0xFFFFDCC2, nightBg = 0xFF6B3200,
        dayFg = 0xFF5C2A00, nightFg = 0xFFFFDCC2,
    )
    private val yellowPal = pal(
        dayBg = 0xFFF0E395, nightBg = 0xFF524800,
        dayFg = 0xFF494000, nightFg = 0xFFF0E395,
    )
    private val greenPal = pal(
        dayBg = 0xFFC9EFCF, nightBg = 0xFF1D5430,
        dayFg = 0xFF0E4523, nightFg = 0xFFC9EFCF,
    )
    private val emptyPal = pal(
        dayBg = 0xFFE2E9E6, nightBg = 0xFF232A28,
        dayFg = 0xFF3F4946, nightFg = 0xFFBEC9C5,
    )

    // Hazard → glyph. Covers every key AppState.notif can emit (those keys
    // are the FCM topic universe); anything else falls back to the level dot.
    private fun glyph(hazard: String?): String? = when (hazard) {
        "heat" -> "🌡️"
        "storm" -> "⛈️"
        "flood" -> "🌊"
        "wind" -> "💨"
        "sandstorm" -> "🌫️"
        "fire" -> "🔥"
        "road" -> "🚗"
        "quake" -> "⚡"
        "cold" -> "❄️"
        "other" -> "⚠️"
        else -> null
    }

    @Composable
    private fun WidgetBody(
        context: Context,
        level: Int,
        title: String?,
        sub: String?,
        hazard: String?,
        national: Int,
        updated: String?,
        lang: String,
    ) {
        // Copy follows the APP language (wb_lang), not the system locale:
        // resource resolution would follow the OS and the widget would
        // disagree with the app about which language it speaks. The per-
        // language keys exist precisely so this lookup is explicit.
        val openRes = when (lang) {
            "fr" -> R.string.rb_widget_open_fr
            "ar" -> R.string.rb_widget_open_ar
            else -> R.string.rb_widget_open_en
        }
        val updatedRes = when (lang) {
            "fr" -> R.string.rb_widget_updated_fr
            "ar" -> R.string.rb_widget_updated_ar
            else -> R.string.rb_widget_updated
        }

        val pal = when (level) {
            3 -> redPal
            2 -> orangePal
            1 -> yellowPal
            0 -> greenPal
            else -> emptyPal
        }
        val g = glyph(hazard) ?: when (level) {
            3 -> "🔴"; 2 -> "🟠"; 1 -> "🟡"; 0 -> "✅"; else -> "📡"
        }

        // Arabic renders right-aligned; the glyph still leads (a glance
        // surface keeps one visual anchor, LTR or RTL).
        val hAlign = if (lang == "ar") Alignment.End else Alignment.Start

        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(pal.bg)
                .clickable(actionStartActivity<MainActivity>(context))
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalAlignment = hAlign,
        ) {
            if (level < 0) {
                // Fresh install / no projection yet: the honest empty state.
                Text(
                    context.getString(openRes),
                    style = TextStyle(color = pal.fg, fontSize = 14.sp),
                )
            } else {
                Row(
                    modifier = GlanceModifier.fillMaxWidth().defaultWeight(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(g, style = TextStyle(fontSize = 24.sp))
                    Spacer(GlanceModifier.width(8.dp))
                    Column(modifier = GlanceModifier.defaultWeight()) {
                        Text(
                            title ?: "",
                            style = TextStyle(
                                color = pal.fg,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                            ),
                            maxLines = 2,
                        )
                        if (!sub.isNullOrEmpty()) {
                            Text(
                                sub,
                                style = TextStyle(color = pal.fg, fontSize = 12.sp),
                                maxLines = 1,
                            )
                        }
                    }
                }
                // Footer: national counts + stamp. My wilayas can be calm
                // while the country burns — vigilance means seeing both.
                // Base-100 unpacking matches Dart's packing (58 wilayas).
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (national >= 0) {
                        val nRed = national / 100
                        val nOrange = national % 100
                        Text(
                            "🔴 $nRed · 🟠 $nOrange",
                            style = TextStyle(color = pal.fg, fontSize = 11.sp),
                        )
                    }
                    Spacer(GlanceModifier.defaultWeight())
                    if (!updated.isNullOrEmpty()) {
                        Text(
                            context.getString(updatedRes, updated),
                            style = TextStyle(color = pal.fg, fontSize = 11.sp),
                        )
                    }
                }
            }
        }
    }
}

/**
 * Manifest-registered receiver (exported=false: APPWIDGET_UPDATE is a
 * protected system broadcast, and home_widget's updateWidget sends an
 * explicit in-app broadcast — both arrive without world-readability).
 * Extends HomeWidgetGlanceWidgetReceiver so a Dart-side
 * HomeWidget.updateWidget() redraws from the HomeWidgetPreferences state
 * without any extra code here.
 */
class RbWidgetReceiver : HomeWidgetGlanceWidgetReceiver<RbWidget>() {
    override val glanceAppWidget = RbWidget()
}
