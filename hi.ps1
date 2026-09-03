$root = "src"

$files = @(
    "assets\.gitkeep",

    "components\layout\MainLayout.jsx",
    "components\layout\DashboardLayout.jsx",
    "components\layout\Navbar.jsx",
    "components\layout\Footer.jsx",
    "components\layout\Sidebar.jsx",

    "components\doctors\DoctorCard.jsx",
    "components\doctors\DoctorList.jsx",
    "components\doctors\DoctorFilterBar.jsx",

    "components\appointments\AppointmentCard.jsx",
    "components\appointments\AppointmentForm.jsx",
    "components\appointments\TimeSlotPicker.jsx",

    "components\dashboard\UpcomingAppointments.jsx",
    "components\dashboard\AppointmentHistory.jsx",
    "components\dashboard\FavoriteDoctors.jsx",

    "components\common\Button.jsx",
    "components\common\Modal.jsx",
    "components\common\Loader.jsx",
    "components\common\Badge.jsx",
    "components\common\EmptyState.jsx",

    "pages\Home.jsx",
    "pages\Doctors.jsx",
    "pages\DoctorDetails.jsx",
    "pages\Booking.jsx",
    "pages\Dashboard.jsx",
    "pages\MyAppointments.jsx",
    "pages\Favorites.jsx",
    "pages\Profile.jsx",
    "pages\Login.jsx",
    "pages\NotFound.jsx",

    "hooks\usePractitioners.js",
    "hooks\useSlots.js",
    "hooks\useAppointments.js",
    "hooks\useAuth.js",

    "services\fhirClient.js",
    "services\providerLookup.js",
    "services\localStore.js",

    "context\AuthContext.jsx",

    "data\fallback\practitioners.json",
    "data\fallback\slots.json",
    "data\fallback\appointments.json",

    "utils\dateHelpers.js",
    "utils\formatFhirName.js",

    "routes\AppRoutes.jsx",

    "App.jsx",
    "main.jsx"
)

foreach ($file in $files) {
    $path = Join-Path $root $file
    $directory = Split-Path $path -Parent

    if (!(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }

    if (!(Test-Path $path)) {
        New-Item -ItemType File -Path $path | Out-Null
    }
}

Write-Host ""
Write-Host "CareLink structure created successfully!" -ForegroundColor Green
Write-Host ""

tree $root /F