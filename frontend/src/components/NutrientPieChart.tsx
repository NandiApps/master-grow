interface NutrientPieChartProps {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export function NutrientPieChart({ nitrogen, phosphorus, potassium }: NutrientPieChartProps) {
  const total = nitrogen + phosphorus + potassium;
  const nPercent = (nitrogen / total) * 100;
  const pPercent = (phosphorus / total) * 100;
  const kPercent = (potassium / total) * 100;

  // Calculate SVG pie segments
  const nSlice = (nPercent / 100) * 360;
  const pSlice = (pPercent / 100) * 360;

  const getArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="nutrient-pie-chart">
      <svg viewBox="0 0 100 100" width="120" height="120" className="pie-svg">
        {/* Nitrogen segment */}
        <path
          d={getArcPath(0, nSlice, 40)}
          fill="#ff6b6b"
          className="pie-segment segment-nitrogen"
        />

        {/* Phosphorus segment */}
        <path
          d={getArcPath(nSlice, nSlice + pSlice, 40)}
          fill="#4ecdc4"
          className="pie-segment segment-phosphorus"
        />

        {/* Potassium segment */}
        <path
          d={getArcPath(nSlice + pSlice, 360, 40)}
          fill="#ffe66d"
          className="pie-segment segment-potassium"
        />

        {/* Center circle for donut effect */}
        <circle cx="50" cy="50" r="25" fill="var(--card)" />
      </svg>

      <div className="pie-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff6b6b' }}></span>
          <span className="legend-label">N</span>
          <span className="legend-value">{nPercent.toFixed(0)}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4ecdc4' }}></span>
          <span className="legend-label">P</span>
          <span className="legend-value">{pPercent.toFixed(0)}%</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ffe66d' }}></span>
          <span className="legend-label">K</span>
          <span className="legend-value">{kPercent.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
