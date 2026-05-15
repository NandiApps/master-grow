interface EnvironmentRingsProps {
  temperature: number;
  humidity: number;
  co2: number;
  tempMin?: number;
  tempMax?: number;
  humidityMin?: number;
  humidityMax?: number;
  co2Min?: number;
  co2Max?: number;
}

export function EnvironmentRings({
  temperature,
  humidity,
  co2,
  tempMin = 20,
  tempMax = 26,
  humidityMin = 40,
  humidityMax = 60,
  co2Min = 300,
  co2Max = 1500,
}: EnvironmentRingsProps) {
  const getTempPercent = () => {
    if (temperature < tempMin) return (temperature / tempMin) * 50;
    if (temperature > tempMax) return 50 + ((temperature - tempMax) / (tempMax - tempMin)) * 50;
    return 50 + ((temperature - tempMin) / (tempMax - tempMin)) * 50;
  };

  const getHumidityPercent = () => {
    if (humidity < humidityMin) return (humidity / humidityMin) * 50;
    if (humidity > humidityMax) return 50 + ((humidity - humidityMax) / (humidityMax - humidityMin)) * 50;
    return 50 + ((humidity - humidityMin) / (humidityMax - humidityMin)) * 50;
  };

  const getCo2Percent = () => {
    if (co2 < co2Min) return (co2 / co2Min) * 50;
    if (co2 > co2Max) return 50 + ((co2 - co2Max) / (co2Max - co2Min)) * 50;
    return 50 + ((co2 - co2Min) / (co2Max - co2Min)) * 50;
  };

  const getTempStatus = () => {
    if (temperature < tempMin - 2 || temperature > tempMax + 2) return 'critical';
    if (temperature < tempMin || temperature > tempMax) return 'warning';
    return 'optimal';
  };

  const getHumidityStatus = () => {
    if (humidity < humidityMin - 5 || humidity > humidityMax + 5) return 'critical';
    if (humidity < humidityMin || humidity > humidityMax) return 'warning';
    return 'optimal';
  };

  const getCo2Status = () => {
    if (co2 < co2Min - 100 || co2 > co2Max + 100) return 'critical';
    if (co2 < co2Min || co2 > co2Max) return 'warning';
    return 'optimal';
  };

  return (
    <div className="environment-rings-container">
      <svg viewBox="0 0 200 200" className="environment-rings-svg">
        {/* Background circle */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="var(--border)" strokeWidth="1" />

        {/* CO2 ring (outer) */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="url(#ringGradientCo2)"
          strokeWidth="12"
          strokeDasharray={`${(getCo2Percent() / 100) * (Math.PI * 2 * 80)} ${Math.PI * 2 * 80}`}
          className={`ring ring-co2 status-${getCo2Status()}`}
          strokeLinecap="round"
        />

        {/* Humidity ring (middle) */}
        <circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="url(#ringGradientHumidity)"
          strokeWidth="12"
          strokeDasharray={`${(getHumidityPercent() / 100) * (Math.PI * 2 * 60)} ${Math.PI * 2 * 60}`}
          className={`ring ring-humidity status-${getHumidityStatus()}`}
          strokeLinecap="round"
        />

        {/* Temperature ring (inner) */}
        <circle
          cx="100"
          cy="100"
          r="40"
          fill="none"
          stroke="url(#ringGradientTemp)"
          strokeWidth="12"
          strokeDasharray={`${(getTempPercent() / 100) * (Math.PI * 2 * 40)} ${Math.PI * 2 * 40}`}
          className={`ring ring-temp status-${getTempStatus()}`}
          strokeLinecap="round"
        />

        {/* Center circle */}
        <circle cx="100" cy="100" r="20" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
        <text x="100" y="106" textAnchor="middle" className="ring-center-icon">
          🌱
        </text>

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="ringGradientTemp" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e74c3c" />
            <stop offset="50%" stopColor="#f39c12" />
            <stop offset="100%" stopColor="#27ae60" />
          </linearGradient>
          <linearGradient id="ringGradientHumidity" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e74c3c" />
            <stop offset="50%" stopColor="#3498db" />
            <stop offset="100%" stopColor="#27ae60" />
          </linearGradient>
          <linearGradient id="ringGradientCo2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e74c3c" />
            <stop offset="50%" stopColor="#f39c12" />
            <stop offset="100%" stopColor="#27ae60" />
          </linearGradient>
        </defs>
      </svg>

      <div className="rings-legend">
        <div className="ring-label">
          <span className="ring-name">🌡️ Temp</span>
          <span className="ring-value">{temperature.toFixed(1)}°C</span>
        </div>
        <div className="ring-label">
          <span className="ring-name">💨 Humidity</span>
          <span className="ring-value">{humidity.toFixed(0)}%</span>
        </div>
        <div className="ring-label">
          <span className="ring-name">🔬 CO₂</span>
          <span className="ring-value">{co2.toFixed(0)} ppm</span>
        </div>
      </div>
    </div>
  );
}
