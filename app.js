document.addEventListener("DOMContentLoaded", () => {
    const cryptoSelect = document.getElementById("cryptoSelect");
    const timeInterval = document.getElementById("timeInterval");
    const ctx = document.getElementById("cryptoChart").getContext("2d");

    let ws;
    let chart;
    let chartData = {};
    let selectedSymbol = "ethusdt";
    let selectedInterval = "1m";

    // Function to initialize WebSocket connection
    const connectWebSocket = () => {
        if (ws) {
            ws.close();
        }

        const url = `wss://stream.binance.com:9443/ws/${selectedSymbol}@kline_${selectedInterval}`;
        ws = new WebSocket(url);

        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.k) {
                updateChart(message.k);
            }
        };
    };

    // Function to update chart data
    const updateChart = (klineData) => {
        const { t, o, h, l, c } = klineData; // Open time, Open, High, Low, Close

        // Store the candlestick data
        if (!chartData[selectedSymbol]) {
            chartData[selectedSymbol] = [];
        }

        // Update existing candlestick or add a new one
        let existingIndex = chartData[selectedSymbol].findIndex(data => data.x === t);
        if (existingIndex >= 0) {
            chartData[selectedSymbol][existingIndex] = {
                x: t,
                y: [parseFloat(o), parseFloat(h), parseFloat(l), parseFloat(c)]
            };
        } else {
            chartData[selectedSymbol].push({
                x: t,
                y: [parseFloat(o), parseFloat(h), parseFloat(l), parseFloat(c)]
            });
        }

        localStorage.setItem('chartData', JSON.stringify(chartData));
        renderChart();
    };

    // Function to render chart using Chart.js
    const renderChart = () => {
        const currentData = chartData[selectedSymbol] || [];

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: selectedSymbol.toUpperCase(),
                    data: currentData,
                    borderColor: '#00FF00',
                    backgroundColor: '#008000',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            tooltipFormat: 'MMM D, h:mm a'
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    };

    // Event listener for cryptocurrency selection change
    cryptoSelect.addEventListener("change", () => {
        selectedSymbol = cryptoSelect.value;
        chartData[selectedSymbol] = JSON.parse(localStorage.getItem('chartData'))[selectedSymbol] || [];
        connectWebSocket();
        renderChart();
    });

    // Event listener for interval change
    timeInterval.addEventListener("change", () => {
        selectedInterval = timeInterval.value;
        connectWebSocket();
    });

    // Initialize the first chart and WebSocket
    const initialize = () => {
        if (localStorage.getItem('chartData')) {
            chartData = JSON.parse(localStorage.getItem('chartData'));
        } else {
            chartData = {};
        }
        connectWebSocket();
    };

    initialize();
});