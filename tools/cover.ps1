# Crops an image to 2:3 (centre) and saves it as a 400 x 600 JPEG. Used by tools/covers.mjs.
param([string]$src, [string]$dest)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($src)
$W = 400; $H = 600
# the largest 2:3 area in the middle of the source
$cw = [math]::Min($img.Width, [math]::Floor($img.Height * 2 / 3))
$ch = [math]::Floor($cw * 3 / 2)
$cx = [math]::Floor(($img.Width - $cw) / 2)
$cy = [math]::Floor(($img.Height - $ch) / 2)
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$attr = New-Object System.Drawing.Imaging.ImageAttributes
$attr.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $W, $H), $cx, $cy, $cw, $ch, [System.Drawing.GraphicsUnit]::Pixel, $attr)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]84)
$bmp.Save($dest, $codec, $params)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
