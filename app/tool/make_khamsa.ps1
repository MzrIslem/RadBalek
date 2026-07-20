# Rad Balek khamsa — traditional symmetric protective hand (3 fingers up,
# 2 mirrored thumbs splaying outward) with an eye of vigilance.
# Floating Material You foreground: transparent bg, teal hand.
Add-Type -AssemblyName System.Drawing

function RR($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function DrawKhamsa($size, $scale, $handColor, $eyeMode) {
  $b = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = "AntiAlias"
  $sc = $size / 1024.0 * $scale
  $off = $size * (1 - $scale) / 2
  $g.TranslateTransform([single]$off, [single]$off)
  $g.ScaleTransform([single]$sc, [single]$sc)
  $brush = New-Object System.Drawing.SolidBrush($handColor)

  # palm + three fingers (one merged path)
  $hand = New-Object System.Drawing.Drawing2D.GraphicsPath
  $hand.AddPath((RR 372 400 280 320 110), $false)
  $hand.AddPath((RR 486 250 52 235 26), $false)
  $hand.AddPath((RR 424 300 48 190 24), $false)
  $hand.AddPath((RR 552 300 48 190 24), $false)
  $g.FillPath($brush, $hand)

  # two thumbs — broad rounded bars on the palm sides, splayed via a trapezoid
  # (manual points, no rotation): base tucks into palm, tip leans outward.
  foreach ($side in @(-1, 1)) {
    $th = New-Object System.Drawing.Drawing2D.GraphicsPath
    if ($side -lt 0) {
      $th.AddArc(300, 452, 62, 62, 150, 180)
      $th.AddLine(300, 483, 372, 560)
      $th.AddLine(400, 512, 362, 452)
    } else {
      $th.AddArc(662, 452, 62, 62, 210, -180)
      $th.AddLine(724, 483, 652, 560)
      $th.AddLine(624, 512, 662, 452)
    }
    $th.CloseFigure()
    $g.FillPath($brush, $th)
    $g.FillEllipse($brush, [single]($(if($side -lt 0){298}else{664})), [single]452, [single]62, [single]62)
  }

  # Signal motif in the palm: radar waves emanating from an alert origin.
  if ($eyeMode -ne "none") {
    $ox = 512.0; $oy = 660.0
    if ($eyeMode -eq "cut") {
      $g.CompositingMode = "SourceCopy"
      $clear = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0,0,0,0), 24)
      $clear.StartCap = "Round"; $clear.EndCap = "Round"
      foreach ($r in @(40, 82, 124)) { $g.DrawArc($clear, [single]($ox-$r), [single]($oy-$r), [single]($r*2), [single]($r*2), 212, 116) }
      $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0,0,0,0))), [single]($ox-17), [single]($oy-17), [single]34, [single]34)
    } else {
      $wpen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 26)
      $wpen.StartCap = "Round"; $wpen.EndCap = "Round"
      foreach ($r in @(40, 82, 124)) { $g.DrawArc($wpen, [single]($ox-$r), [single]($oy-$r), [single]($r*2), [single]($r*2), 212, 116) }
      $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,210,31,31))), [single]($ox-17), [single]($oy-17), [single]34, [single]34)
    }
  }
  $g.Dispose()
  return $b
}

$teal = [System.Drawing.Color]::FromArgb(255,0,106,96)
$white = [System.Drawing.Color]::White
$dir = "C:\AISX\algeria-ews\app\assets"

$hand = DrawKhamsa 1024 1.12 $teal "eye"
$bg = New-Object System.Drawing.Bitmap 1024,1024
$gg = [System.Drawing.Graphics]::FromImage($bg); $gg.Clear([System.Drawing.Color]::FromArgb(255,241,245,242)); $gg.DrawImage($hand,0,0); $gg.Dispose()
$bg.Save("$dir\icon.png"); $bg.Dispose(); $hand.Dispose()

(DrawKhamsa 1024 0.78 $teal "eye").Save("$dir\icon_fg.png")
(DrawKhamsa 1024 0.78 $white "cut").Save("$dir\icon_mono.png")
(DrawKhamsa 512 0.92 $teal "eye").Save("$dir\logo.png")
Write-Output "khamsa v2 written"
