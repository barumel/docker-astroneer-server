@echo off
set "filePath=%LocalAppData%\Astro\Saved\Config\WindowsNoEditor\Engine.ini"

echo [SystemSettings] >> "%filePath%"
echo net.AllowEncryption=True >> "%filePath%"

echo Lines added to %filePath%
pause
