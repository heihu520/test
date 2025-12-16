document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    // 1. 设置日期显示
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('zh-CN', options);

    // 2. 配置全局 Chart 默认字体
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // 3. 用户分布图 (Doughnut)
    // 保持静态 Mock 数据展示，或者也可以从后端获取
    const ctxUser = document.getElementById('userChart').getContext('2d');
    new Chart(ctxUser, {
        type: 'doughnut',
        data: {
            labels: ['桌面端', '移动端', '平板'],
            datasets: [{
                data: [55, 30, 15],
                backgroundColor: ['#22d3ee', '#c084fc', '#f472b6'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '70%',
        }
    });

    // 4. 收入增长图 (Line with Gradient)
    const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
    const gradient1 = ctxRevenue.createLinearGradient(0, 0, 0, 400);
    gradient1.addColorStop(0, 'rgba(34, 211, 238, 0.5)');
    gradient1.addColorStop(1, 'rgba(34, 211, 238, 0.0)');
    const gradient2 = ctxRevenue.createLinearGradient(0, 0, 0, 400);
    gradient2.addColorStop(0, 'rgba(192, 132, 252, 0.5)');
    gradient2.addColorStop(1, 'rgba(192, 132, 252, 0.0)');

    new Chart(ctxRevenue, {
        type: 'line',
        data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [
                {
                    label: '本周收入',
                    data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
                    borderColor: '#22d3ee',
                    backgroundColor: gradient1,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: '#22d3ee',
                    pointBorderWidth: 2
                },
                {
                    label: '上周收入',
                    data: [10000, 15000, 12000, 20000, 18000, 24000, 22000],
                    borderColor: '#c084fc',
                    backgroundColor: gradient2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: '#c084fc',
                    pointBorderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    usePointStyle: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { callback: function (value) { return '$' + value / 1000 + 'k'; } }
                },
                x: { grid: { display: false } }
            },
            interaction: { mode: 'index', intersect: false },
        }
    });

    // 5. Fetch Recent Transactions
    try {
        const res = await fetch('/api/transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.data) {
            const tbody = document.querySelector('.styled-table tbody');
            tbody.innerHTML = ''; // Clear mock data

            data.data.forEach(tx => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="td-user">
                            <div class="temp-avatar" style="background:${tx.avatar_color}">${tx.user_initial}</div>
                            <span>${tx.user_name}</span>
                        </div>
                    </td>
                    <td>${tx.date}</td>
                    <td><span class="status-pill ${tx.status.toLowerCase()}">${tx.status}</span></td>
                    <td>$${tx.amount.toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Failed to fetch transactions", e);
    }

    // 简单交互：点击导航项高亮
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // e.preventDefault(); // Remove preventing default to allow navigation
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
});
