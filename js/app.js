// 全局数据存储
let allData = {};
let currentTask = null;
let currentData = null;
let filteredResults = null; // 过滤后的结果
let selectedYears = new Set(['all']); // 选中的年份
let selectedMonths = new Set(['all']); // 选中的月份

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
});

// 加载数据
async function loadData() {
    try {
        // 先加载索引文件获取任务列表
        const indexResponse = await fetch('data/index.json');
        const indexData = await indexResponse.json();
        
        // 存储任务列表信息
        window.taskList = indexData.tasks;
        
        // 初始化时只加载任务列表，不加载所有数据
        populateTaskSelector();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('taskSelect').innerHTML = '<option>Error loading data</option>';
    }
}

// 加载单个任务的数据
async function loadTaskData(taskFilename) {
    try {
        const response = await fetch(`data/${taskFilename}`);
        return await response.json();
    } catch (error) {
        console.error('Error loading task data:', error);
        return null;
    }
}

// 填充任务选择器
function populateTaskSelector() {
    const select = document.getElementById('taskSelect');
    select.innerHTML = '<option value="">Select a task...</option>';
    
    if (window.taskList) {
        window.taskList.forEach(task => {
            const option = document.createElement('option');
            option.value = task.filename;
            option.dataset.taskName = task.name;
            option.textContent = task.name;
            select.appendChild(option);
        });
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 任务选择
    document.getElementById('taskSelect').addEventListener('change', async (e) => {
        const selectedFilename = e.target.value;
        if (!selectedFilename) {
            currentTask = null;
            currentData = null;
            return;
        }
        
        const selectedOption = e.target.options[e.target.selectedIndex];
        currentTask = selectedOption.dataset.taskName;
        
        // 显示加载状态
        const select = e.target;
        const originalText = select.options[select.selectedIndex].text;
        select.options[select.selectedIndex].text = 'Loading...';
        
        // 加载任务数据
        const taskData = await loadTaskData(selectedFilename);
        
        // 恢复选项文本
        select.options[select.selectedIndex].text = originalText;
        
        if (taskData) {
            currentData = taskData;
            updateAllViews();
        } else {
            alert('Failed to load task data');
        }
    });

    // Tab切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // 搜索功能
    document.getElementById('twoComboFilter').addEventListener('click', filterTwoCombo);
    document.getElementById('threeComboFilter').addEventListener('click', filterThreeCombo);
    document.getElementById('resultsFilter').addEventListener('click', filterResults);
    
    // 回车键搜索
    document.getElementById('twoComboSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterTwoCombo();
    });
    document.getElementById('threeComboSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterThreeCombo();
    });
    document.getElementById('resultsSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterResults();
    });
    
    // 侧边栏切换
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }
    
    // 时间筛选器事件
    setupTimeFilters();
}

// 设置时间筛选器
function setupTimeFilters() {
    const yearFilter = document.getElementById('yearFilter');
    const monthFilter = document.getElementById('monthFilter');
    
    // 年份筛选器事件
    yearFilter.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            if (e.target.value === 'all') {
                if (e.target.checked) {
                    selectedYears.clear();
                    selectedYears.add('all');
                    // 取消选中其他年份
                    yearFilter.querySelectorAll('input[type="checkbox"]:not([value="all"])').forEach(cb => {
                        cb.checked = false;
                    });
                }
            } else {
                // 取消"全部"选项
                const allCheckbox = yearFilter.querySelector('input[value="all"]');
                if (allCheckbox) allCheckbox.checked = false;
                selectedYears.delete('all');
                
                if (e.target.checked) {
                    selectedYears.add(e.target.value);
                } else {
                    selectedYears.delete(e.target.value);
                }
                
                // 如果没有任何选中，选中"全部"
                if (selectedYears.size === 0) {
                    selectedYears.add('all');
                    allCheckbox.checked = true;
                }
            }
            applyTimeFilter();
        }
    });
    
    // 月份筛选器事件
    monthFilter.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            if (e.target.value === 'all') {
                if (e.target.checked) {
                    selectedMonths.clear();
                    selectedMonths.add('all');
                    // 取消选中其他月份
                    monthFilter.querySelectorAll('input[type="checkbox"]:not([value="all"])').forEach(cb => {
                        cb.checked = false;
                    });
                }
            } else {
                // 取消"全部"选项
                const allCheckbox = monthFilter.querySelector('input[value="all"]');
                if (allCheckbox) allCheckbox.checked = false;
                selectedMonths.delete('all');
                
                if (e.target.checked) {
                    selectedMonths.add(e.target.value);
                } else {
                    selectedMonths.delete(e.target.value);
                }
                
                // 如果没有任何选中，选中"全部"
                if (selectedMonths.size === 0) {
                    selectedMonths.add('all');
                    allCheckbox.checked = true;
                }
            }
            applyTimeFilter();
        }
    });
}

// 应用时间筛选
function applyTimeFilter() {
    if (!currentData || !currentData.results) return;
    
    filteredResults = currentData.results.filter(result => {
        // 如果没有日期信息，显示所有结果
        if (!result.year || !result.month) return true;
        
        const yearMatch = selectedYears.has('all') || selectedYears.has(result.year_str);
        const monthMatch = selectedMonths.has('all') || selectedMonths.has(result.month_str);
        
        return yearMatch && monthMatch;
    });
    
    updateResultsView();
}

// 构建时间筛选器
function buildTimeFilters() {
    if (!currentData || !currentData.results) return;
    
    const years = new Set();
    const months = new Set();
    
    currentData.results.forEach(result => {
        if (result.year_str) {
            years.add(result.year_str);
        }
        if (result.month_str) {
            months.add(result.month_str);
        }
    });
    
    // 构建年份筛选器
    const yearFilter = document.getElementById('yearFilter');
    yearFilter.innerHTML = '<div class="filter-item"><label><input type="checkbox" value="all" checked> All Years</label></div>';
    
    Array.from(years).sort().reverse().forEach(year => {
        const item = document.createElement('div');
        item.className = 'filter-item';
        item.innerHTML = `<label><input type="checkbox" value="${year}"> ${year}</label>`;
        yearFilter.appendChild(item);
    });
    
    // 构建月份筛选器
    const monthFilter = document.getElementById('monthFilter');
    monthFilter.innerHTML = '<div class="filter-item"><label><input type="checkbox" value="all" checked> All Months</label></div>';
    
    // 月份名称映射
    const monthNames = {
        '01': 'January', '02': 'February', '03': 'March', '04': 'April',
        '05': 'May', '06': 'June', '07': 'July', '08': 'August',
        '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    
    Array.from(months).sort().reverse().forEach(monthStr => {
        const [year, month] = monthStr.split('-');
        const monthName = monthNames[month] || month;
        const item = document.createElement('div');
        item.className = 'filter-item';
        item.innerHTML = `<label><input type="checkbox" value="${monthStr}"> ${monthName} ${year}</label>`;
        monthFilter.appendChild(item);
    });
    
    // 重置筛选状态
    selectedYears.clear();
    selectedYears.add('all');
    selectedMonths.clear();
    selectedMonths.add('all');
}

// 切换Tab
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// 更新所有视图
function updateAllViews() {
    if (!currentData) return;
    
    updateStatistics();
    updateTwoComboView();
    updateThreeComboView();
    buildTimeFilters();
    applyTimeFilter();
}

// 更新统计信息
function updateStatistics() {
    const twoComboCount = currentData.two_combos?.length || 0;
    const threeComboCount = currentData.three_combos?.length || 0;
    const totalResults = filteredResults ? filteredResults.length : (currentData.results?.length || 0);
    
    document.getElementById('twoComboCount').textContent = twoComboCount;
    document.getElementById('threeComboCount').textContent = threeComboCount;
    document.getElementById('totalResults').textContent = totalResults;
}

// 更新2组合视图
function updateTwoComboView() {
    if (!currentData.two_combos) return;
    
    const tbody = document.querySelector('#twoComboTable tbody');
    tbody.innerHTML = '';
    
    currentData.two_combos.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.keyword1)}</td>
            <td>${escapeHtml(item.keyword2)}</td>
            <td>${item.count}</td>
            <td><a href="${item.url}" target="_blank" class="link-btn">View</a></td>
        `;
        tbody.appendChild(row);
    });
    
    updateTwoComboChart();
}

// 更新3组合视图
function updateThreeComboView() {
    if (!currentData.three_combos) return;
    
    const tbody = document.querySelector('#threeComboTable tbody');
    tbody.innerHTML = '';
    
    currentData.three_combos.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.keyword1)}</td>
            <td>${escapeHtml(item.keyword2)}</td>
            <td>${escapeHtml(item.keyword3)}</td>
            <td>${item.count}</td>
            <td><a href="${item.url}" target="_blank" class="link-btn">View</a></td>
        `;
        tbody.appendChild(row);
    });
    
    updateThreeComboChart();
}

// 更新结果视图
function updateResultsView() {
    const resultsToShow = filteredResults || currentData?.results || [];
    
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';
    
    if (resultsToShow.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No results found matching the selected filters.</div>';
        return;
    }
    
    resultsToShow.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="date">${escapeHtml(result.date || 'No date')}</div>
            <div class="title">${escapeHtml(result.title || 'No title')}</div>
            <div class="content">${escapeHtml(result.content || 'No content')}</div>
        `;
        grid.appendChild(card);
    });
    
    // 更新统计信息
    if (filteredResults) {
        document.getElementById('totalResults').textContent = filteredResults.length;
    }
}

// 过滤2组合
function filterTwoCombo() {
    const searchTerm = document.getElementById('twoComboSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#twoComboTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// 过滤3组合
function filterThreeCombo() {
    const searchTerm = document.getElementById('threeComboSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#threeComboTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// 过滤结果（文本搜索）
function filterResults() {
    const searchTerm = document.getElementById('resultsSearch').value.toLowerCase();
    
    if (!searchTerm) {
        // 如果没有搜索词，只应用时间筛选
        applyTimeFilter();
        return;
    }
    
    // 应用文本搜索和时间筛选
    const resultsToFilter = filteredResults || currentData?.results || [];
    const searchFiltered = resultsToFilter.filter(result => {
        const text = `${result.date || ''} ${result.title || ''} ${result.content || ''}`.toLowerCase();
        return text.includes(searchTerm);
    });
    
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';
    
    if (searchFiltered.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No results found matching your search.</div>';
        return;
    }
    
    searchFiltered.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="date">${escapeHtml(result.date || 'No date')}</div>
            <div class="title">${escapeHtml(result.title || 'No title')}</div>
            <div class="content">${escapeHtml(result.content || 'No content')}</div>
        `;
        grid.appendChild(card);
    });
    
    // 更新统计
    document.getElementById('totalResults').textContent = searchFiltered.length;
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

