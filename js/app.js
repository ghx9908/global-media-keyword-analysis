// 全局数据存储
let allData = {};
let currentTask = null;
let currentData = null;
let filteredResults = null; // Filtered results

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
        
        // Initialize navigation menu
        populateNavMenu();
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

// Extract English part from task name
function extractEnglishPart(taskName) {
    // Find the first English letter and extract from there
    const match = taskName.match(/[A-Za-z].*/);
    return match ? match[0] : taskName;
}

// Populate navigation menu
function populateNavMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = '';
    
    if (window.taskList) {
        window.taskList.forEach((task, index) => {
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = extractEnglishPart(task.name);
            link.dataset.filename = task.filename;
            link.dataset.taskName = task.name;
            
            // Set first item as active by default
            if (index === 0) {
                link.classList.add('active');
            }
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all items
                document.querySelectorAll('.nav-item a').forEach(a => a.classList.remove('active'));
                // Add active class to clicked item
                link.classList.add('active');
                // Load task data
                loadTaskByFilename(task.filename, task.name);
            });
            
            navItem.appendChild(link);
            navMenu.appendChild(navItem);
        });
        
        // Load first task by default
        if (window.taskList.length > 0) {
            const firstTask = window.taskList[0];
            loadTaskByFilename(firstTask.filename, firstTask.name);
        }
    }
}

// Load task by filename
async function loadTaskByFilename(filename, taskName) {
    currentTask = taskName;
    
    // Show loading state
    const navItems = document.querySelectorAll('.nav-item a');
    navItems.forEach(item => {
        if (item.dataset.filename === filename) {
            const originalText = item.textContent;
            item.textContent = 'Loading...';
            item.dataset.originalText = originalText;
        }
    });
    
    // Load task data
    const taskData = await loadTaskData(filename);
    
    // Restore text
    navItems.forEach(item => {
        if (item.dataset.filename === filename && item.dataset.originalText) {
            item.textContent = item.dataset.originalText;
            delete item.dataset.originalText;
        }
    });
    
    if (taskData) {
        currentData = taskData;
        updateAllViews();
    } else {
        alert('Failed to load task data');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Search functionality
    document.getElementById('threeComboFilter').addEventListener('click', filterThreeCombo);
    document.getElementById('resultsFilter').addEventListener('click', filterResults);
    
    // Enter key search
    document.getElementById('threeComboSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterThreeCombo();
    });
    document.getElementById('resultsSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterResults();
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }
    
    // Time search events
    setupTimeSearch();
}

// Setup time search with year selector
function setupTimeSearch() {
    const yearSelect = document.getElementById('yearSelect');
    
    if (!yearSelect) return;
    
    // Populate year selector when data is loaded
    populateYearSelector();
    
    // Add event listener
    yearSelect.addEventListener('change', applyTimeFilter);
}

// Populate year selector with available years from data
function populateYearSelector() {
    if (!currentData || !currentData.results) return;
    
    const years = new Set();
    currentData.results.forEach(result => {
        if (result.year_str) {
            years.add(result.year_str);
        }
    });
    
    // Sort years (newest first)
    const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    
    const yearSelect = document.getElementById('yearSelect');
    
    if (!yearSelect) return;
    
    // Clear existing options (except "All Years")
    yearSelect.innerHTML = '<option value="">All Years</option>';
    
    // Add year options
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

// Apply time filter based on year selector
function applyTimeFilter() {
    if (!currentData || !currentData.results) return;
    
    const yearSelect = document.getElementById('yearSelect');
    
    if (!yearSelect) {
        filteredResults = currentData.results;
        updateResultsView();
        return;
    }
    
    const selectedYear = yearSelect.value;
    
    // If no year selected, show all
    if (!selectedYear) {
        filteredResults = currentData.results;
        updateResultsView();
        return;
    }
    
    // Filter results by year
    filteredResults = currentData.results.filter(result => {
        if (!result.year_str) return false;
        return result.year_str === selectedYear;
    });
    
    updateResultsView();
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

// Update all views
function updateAllViews() {
    if (!currentData) return;
    
    updateStatistics();
    updateThreeComboView();
    // Populate year selector and reset filter
    populateYearSelector();
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) yearSelect.value = '';
    applyTimeFilter();
}

// Update statistics
function updateStatistics() {
    const threeComboCount = currentData.three_combos?.length || 0;
    const totalResults = filteredResults ? filteredResults.length : (currentData.results?.length || 0);
    
    document.getElementById('threeComboCount').textContent = threeComboCount;
    document.getElementById('totalResults').textContent = totalResults;
}

// Update three-combo view
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

// Filter three-combo
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

