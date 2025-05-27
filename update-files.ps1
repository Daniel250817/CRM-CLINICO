#!/bin/pwsh
# Script para actualizar los archivos modificados

# Función para actualizar un archivo
function Update-File {
    param(
        [string]$Source,
        [string]$Destination
    )
    
    if (Test-Path $Source) {
        Write-Host "Actualizando $Destination"
        Copy-Item -Path $Source -Destination $Destination -Force
    } else {
        Write-Host "Error: El archivo $Source no existe"
    }
}

# Directorio base
$baseDir = "d:\julio\Documents\CRM-Clinico\CRM-Clinico-FrontEnd"

# Actualizando archivos modificados
Update-File "$baseDir\src\pages\auth\Login.tsx.new" "$baseDir\src\pages\auth\Login.tsx"
Update-File "$baseDir\src\pages\dashboard\index.tsx.new" "$baseDir\src\pages\dashboard\index.tsx"
Update-File "$baseDir\src\services\api.ts.new" "$baseDir\src\services\api.ts"

Write-Host "`nProceso completado. Los archivos han sido actualizados para quitar los datos quemados."
