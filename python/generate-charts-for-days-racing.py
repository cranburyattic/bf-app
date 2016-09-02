import matplotlib as mpl
mpl.use('Agg')
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import yaml
import os
from datetime import datetime as dt
from matplotlib.dates import date2num
from matplotlib.colors import colorConverter
path = '';

with open('../config/betfair_config.yml', 'r') as f:
    doc = yaml.load(f)
    data_dir = doc['default']['betfair']['data_dir']

todays_date = strftime('%Y-%-m-%-d', gmtime())


f = open(data_dir + '/data/' + todays_date + '/processed.txt', 'r')
line = f.readline()
files = line.split(',')
f.close()

for file in files:
    dateparse = lambda x: dt.strptime(x, '%Y-%m-%dT%H:%M:%S.%fZ')
    file_bets = data_dir + '/data/' + todays_date + '/bets-' + file + '.csv'
    file_markets = data_dir + '/data/' + todays_date + '/prices-' + file + '.csv'
    file_info = data_dir + '/data/' + todays_date + '/info-' + file + '.csv'
    markets = pd.read_csv(file_bets)
    prices = pd.read_csv(file_markets,header=None)
    fig, ax = plt.subplots()

    info = open(file_info, 'r')
    ax.set_title(info.readline(),fontsize=14)
    info.close();
    ax.set_xlabel('TIME',fontsize=12)
    ax.set_ylabel('PRICE',fontsize=12)

    gca = plt.gca()

    ax2 = ax.twinx()

    ax.scatter(markets['placedDateSeconds'], markets['backPriceRequested'], s=200, c='#89B9EF', alpha=0.8 )
    ax.scatter(markets['placedDateSeconds'], markets['layPriceRequested'], s=200, c='#E7A7B7', alpha=0.8 )
    ax.scatter(markets['matchedDateSeconds'], markets['priceMatched'], s=50, c='g', alpha=0.5 )
    ax.plot(prices[0], prices[1], c='b', alpha=0.5)
    #ax2.scatter(markets['matchedDateSeconds'], markets['profit'], s=50, c='r', alpha=0.5 )
    ax2.scatter(markets['matchedDateSeconds'], markets['back'], s=50, c='y', alpha=0.5 )
    ax2.scatter(markets['matchedDateSeconds'], markets['lay'], s=50, c='y', alpha=0.5 )

    fig.savefig(data_dir + '/data/' + todays_date + '/chart-' + file + '.png', dpi=100)
