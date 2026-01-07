#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据解析脚本：将文本文件转换为JSON格式供前端使用
"""

import os
import json
import re
from pathlib import Path

def parse_summary_log(file_path):
    """解析summary日志文件，区分2组合和3组合"""
    two_combos = []
    three_combos = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or not line.startswith('条件:'):
                continue
            
            # 解析格式：条件: keyword1+keyword2 | 结果: N 条 | URL: ...
            match = re.match(r'条件:\s*(.+?)\s*\|\s*结果:\s*(\d+)\s*条\s*\|\s*URL:\s*(.+)', line)
            if not match:
                continue
            
            condition = match.group(1).strip()
            count = int(match.group(2))
            url = match.group(3).strip()
            
            # 判断是2组合还是3组合（通过+号数量）
            keywords = [k.strip() for k in condition.split('+')]
            keywords = [k for k in keywords if k]  # 过滤空字符串
            
            if len(keywords) == 2:
                two_combos.append({
                    'keyword1': keywords[0],
                    'keyword2': keywords[1],
                    'count': count,
                    'url': url,
                    'condition': condition
                })
            elif len(keywords) == 3:
                three_combos.append({
                    'keyword1': keywords[0],
                    'keyword2': keywords[1],
                    'keyword3': keywords[2],
                    'count': count,
                    'url': url,
                    'condition': condition
                })
    
    return two_combos, three_combos

def parse_date(date_str):
    """解析日期字符串，返回年月信息"""
    import re
    from datetime import datetime
    
    # 西班牙语月份映射
    spanish_months = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
        'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
        'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    }
    
    # 英语月份映射
    english_months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    }
    
    date_str = date_str.lower().strip()
    
    # 尝试解析西班牙语格式: "9 de febrero del 2023"
    match = re.search(r'(\d+)\s+de\s+(\w+)\s+del?\s+(\d{4})', date_str)
    if match:
        day, month_name, year = match.groups()
        month = spanish_months.get(month_name, None)
        if month:
            return {
                'year': int(year),
                'month': month,
                'year_month': f"{year}-{month:02d}",
                'year_str': year,
                'month_str': f"{year}-{month:02d}"
            }
    
    # 尝试解析英语格式: "December 25, 2022"
    match = re.search(r'(\w+)\s+(\d+),?\s+(\d{4})', date_str)
    if match:
        month_name, day, year = match.groups()
        month = english_months.get(month_name, None)
        if month:
            return {
                'year': int(year),
                'month': month,
                'year_month': f"{year}-{month:02d}",
                'year_str': year,
                'month_str': f"{year}-{month:02d}"
            }
    
    # 尝试解析ISO格式: "2023-02-09"
    match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', date_str)
    if match:
        year, month, day = match.groups()
        return {
            'year': int(year),
            'month': int(month),
            'year_month': f"{year}-{int(month):02d}",
            'year_str': year,
            'month_str': f"{year}-{int(month):02d}"
        }
    
    # 如果无法解析，返回None
    return None

def parse_results(file_path):
    """解析results.txt文件并去重，同时提取日期信息"""
    results = []
    seen = set()  # 用于去重的集合
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # 按分隔符分割
        items = content.split('---QUERY_RESULT_END---')
        
        for item in items:
            item = item.strip()
            if not item:
                continue
            
            parts = item.split('|||')
            if len(parts) >= 3:
                date = parts[0].strip()
                title = parts[1].strip() if len(parts) > 1 else ''
                content_text = parts[2].strip() if len(parts) > 2 else ''
                
                # 创建唯一标识符：基于title和content的组合
                # 去除空白字符和换行符后进行比较，避免格式差异导致的重复
                title_normalized = ' '.join(title.split())
                content_normalized = ' '.join(content_text.split())
                unique_key = f"{title_normalized}|||{content_normalized}"
                
                # 如果这个结果还没有见过，则添加
                if unique_key not in seen:
                    seen.add(unique_key)
                    
                    # 解析日期信息
                    date_info = parse_date(date)
                    
                    result_item = {
                        'date': date,
                        'title': title,
                        'content': content_text
                    }
                    
                    # 如果成功解析日期，添加日期分类信息
                    if date_info:
                        result_item.update(date_info)
                    
                    results.append(result_item)
    
    return results

def parse_two_combo_results(file_path):
    """解析two_combo_results文件"""
    results = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            
            parts = line.split('|||')
            if len(parts) >= 5:
                category = parts[0].strip()
                keyword1 = parts[1].strip()
                keyword2 = parts[2].strip()
                count = int(parts[4].strip()) if parts[4].strip().isdigit() else 0
                
                results.append({
                    'category': category,
                    'keyword1': keyword1,
                    'keyword2': keyword2,
                    'count': count
                })
    
    return results

def main():
    """主函数：处理所有数据文件"""
    base_dir = Path(__file__).parent.parent.parent
    task_data_dir = base_dir / 'task_data'
    summary_logs_dir = base_dir / 'search_summary_logs'
    output_dir = Path(__file__).parent
    
    all_data = {}
    deduplication_stats = {}  # 存储去重统计信息
    
    # 处理所有task_data目录
    for task_dir in task_data_dir.iterdir():
        if not task_dir.is_dir():
            continue
        
        task_name = task_dir.name
        
        # 解析results.txt
        results_file = task_dir / 'results.txt'
        if results_file.exists():
            # 先计算原始数量
            with open(results_file, 'r', encoding='utf-8') as f:
                content = f.read()
                items = content.split('---QUERY_RESULT_END---')
                original_count = len([item for item in items if item.strip()])
            
            # 解析并去重
            results = parse_results(results_file)
            deduplicated_count = len(results)
            
            if task_name not in all_data:
                all_data[task_name] = {}
            all_data[task_name]['results'] = results
            
            # 记录去重统计
            if original_count > deduplicated_count:
                deduplication_stats[task_name] = {
                    'original': original_count,
                    'deduplicated': deduplicated_count,
                    'removed': original_count - deduplicated_count
                }
        
        # 解析two_combo_results
        two_combo_file = task_dir / f'two_combo_results_{task_name}.txt'
        if two_combo_file.exists():
            two_combo_data = parse_two_combo_results(two_combo_file)
            if task_name not in all_data:
                all_data[task_name] = {}
            all_data[task_name]['two_combo_results'] = two_combo_data
    
    # 处理所有summary日志文件
    for summary_file in summary_logs_dir.glob('*_summary.txt'):
        task_name = summary_file.stem.replace('_summary', '')
        two_combos, three_combos = parse_summary_log(summary_file)
        
        if task_name not in all_data:
            all_data[task_name] = {}
        all_data[task_name]['two_combos'] = two_combos
        all_data[task_name]['three_combos'] = three_combos
    
    # 保存为多个JSON文件，每个任务一个文件
    import re
    
    def sanitize_filename(name):
        """将任务名称转换为安全的文件名"""
        # 替换特殊字符为下划线
        name = re.sub(r'[<>:"/\\|?*]', '_', name)
        # 移除首尾空格和点
        name = name.strip('. ')
        return name
    
    # 创建任务列表文件
    task_list = []
    
    for task_name, data in all_data.items():
        # 生成安全的文件名
        safe_filename = sanitize_filename(task_name)
        output_file = output_dir / f'{safe_filename}.json'
        
        # 保存单个任务的数据
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # 添加到任务列表
        task_list.append({
            'name': task_name,
            'filename': f'{safe_filename}.json',
            'two_combos': len(data.get('two_combos', [])),
            'three_combos': len(data.get('three_combos', [])),
            'results': len(data.get('results', []))
        })
        
        print(f"Saved: {output_file.name}")
    
    # 保存任务列表索引文件
    index_file = output_dir / 'index.json'
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump({
            'tasks': task_list,
            'total_tasks': len(task_list)
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nData parsed successfully!")
    print(f"Total tasks: {len(all_data)}")
    print(f"Index file: {index_file.name}")
    
    # 统计信息
    for task_name, data in all_data.items():
        print(f"\n{task_name}:")
        if 'two_combos' in data:
            print(f"  Two-combo queries: {len(data['two_combos'])}")
        if 'three_combos' in data:
            print(f"  Three-combo queries: {len(data['three_combos'])}")
        if 'results' in data:
            result_count = len(data['results'])
            if task_name in deduplication_stats:
                stats = deduplication_stats[task_name]
                print(f"  Results: {result_count} (original: {stats['original']}, removed {stats['removed']} duplicates)")
            else:
                print(f"  Results: {result_count}")

if __name__ == '__main__':
    main()

