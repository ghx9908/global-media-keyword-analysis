let threeComboChart = null;

function updateThreeComboChart() {
    if (!currentData || !currentData.three_combos) return;
    
    const ctx = document.getElementById('threeComboChart');
    if (!ctx) return;
    
    // 按count排序，取前10
    const sorted = [...currentData.three_combos]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    if (sorted.length === 0) {
        if (threeComboChart) {
            threeComboChart.destroy();
            threeComboChart = null;
        }
        return;
    }
    
    const labels = sorted.map(item => {
        const k1 = item.keyword1.length > 10 ? item.keyword1.substring(0, 10) + '...' : item.keyword1;
        const k2 = item.keyword2.length > 10 ? item.keyword2.substring(0, 10) + '...' : item.keyword2;
        const k3 = item.keyword3.length > 10 ? item.keyword3.substring(0, 10) + '...' : item.keyword3;
        return `${k1} + ${k2} + ${k3}`;
    });
    const data = sorted.map(item => item.count);
    
    if (threeComboChart) {
        threeComboChart.destroy();
    }
    
    threeComboChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Result Count',
                data: data,
                backgroundColor: 'rgba(118, 75, 162, 0.8)',
                borderColor: 'rgba(118, 75, 162, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

