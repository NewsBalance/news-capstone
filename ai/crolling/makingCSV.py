#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue May 13 15:56:21 2025

@author: sung0
"""

import csv

# 입력 파일명과 출력 파일명 설정
input_file = '/Users/sung0/Desktop/news-capstone/ai/data/cleaned_data.csv'
output_file = '/Users/sung0/Desktop/news-capstone/ai/data/final_data.csv'


with open(input_file, 'r', encoding='utf-8') as infile, \
     open(output_file, 'w', encoding='utf-8') as outfile:
    
    for line in infile:
        if ',' not in line:
            continue
        
        parts = line.strip().rsplit(',', 1)
        if len(parts) != 2:
            continue

        text = parts[0].strip().strip('"').strip("'")
        label_raw = parts[1].strip().replace('"', '').replace("'", '')

        try:
            label = int(label_raw)
        except ValueError:
            continue

        outfile.write(f'"{text}",{label}\n')

