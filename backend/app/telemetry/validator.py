from typing import Tuple, Optional, Dict, Any

VALID_OPERATING_STATUSES = {"RUNNING", "IDLE", "STANDBY", "STOPPED"}

# Physical operating sanity boundaries
MIN_PLAUSIBLE_TEMPERATURE = -40.0
MAX_PLAUSIBLE_TEMPERATURE = 200.0

MIN_PLAUSIBLE_PRESSURE = 0.0
MAX_PLAUSIBLE_PRESSURE = 100.0

MIN_PLAUSIBLE_VIBRATION = 0.0
MAX_PLAUSIBLE_VIBRATION = 50.0

MIN_PLAUSIBLE_POWER = 0.0
MAX_PLAUSIBLE_POWER = 1000.0

def validate_telemetry_payload(data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validates physical plausibility and format of incoming telemetry.
    Returns (is_valid, error_message).
    """
    temp = data.get("temperature")
    if temp is None or not isinstance(temp, (int, float)):
        return False, "Temperature is required and must be numeric"
    if temp < MIN_PLAUSIBLE_TEMPERATURE or temp > MAX_PLAUSIBLE_TEMPERATURE:
        return False, f"Temperature {temp}°C is outside physically plausible range [{MIN_PLAUSIBLE_TEMPERATURE}, {MAX_PLAUSIBLE_TEMPERATURE}]"

    pressure = data.get("pressure")
    if pressure is None or not isinstance(pressure, (int, float)):
        return False, "Pressure is required and must be numeric"
    if pressure < MIN_PLAUSIBLE_PRESSURE or pressure > MAX_PLAUSIBLE_PRESSURE:
        return False, f"Pressure {pressure} bar is outside physically plausible range [{MIN_PLAUSIBLE_PRESSURE}, {MAX_PLAUSIBLE_PRESSURE}]"

    vibration = data.get("vibration")
    if vibration is None or not isinstance(vibration, (int, float)):
        return False, "Vibration is required and must be numeric"
    if vibration < MIN_PLAUSIBLE_VIBRATION or vibration > MAX_PLAUSIBLE_VIBRATION:
        return False, f"Vibration {vibration} mm/s is outside physically plausible range [{MIN_PLAUSIBLE_VIBRATION}, {MAX_PLAUSIBLE_VIBRATION}]"

    power = data.get("power_consumption")
    if power is None or not isinstance(power, (int, float)):
        return False, "Power consumption is required and must be numeric"
    if power < MIN_PLAUSIBLE_POWER or power > MAX_PLAUSIBLE_POWER:
        return False, f"Power {power} kW is outside physically plausible range [{MIN_PLAUSIBLE_POWER}, {MAX_PLAUSIBLE_POWER}]"

    status = data.get("operating_status")
    if not status or not isinstance(status, str):
        return False, "Operating status is required"
    if status.upper() not in VALID_OPERATING_STATUSES:
        return False, f"Invalid operating status '{status}'. Must be one of {sorted(list(VALID_OPERATING_STATUSES))}"

    return True, None
