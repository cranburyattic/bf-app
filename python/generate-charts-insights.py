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
from time import gmtime, strftime, localtime
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
    file_bets = data_dir + '/data/' + todays_date + '/bets/bets-' + file + '.csv'
    file_insights = data_dir + '/data/' + todays_date + '/insights/insights-' + file + '.csv'
    file_prices = data_dir + '/data/' + todays_date + '/prices/prices-' + file + '.csv'
    file_info = data_dir + '/data/' + todays_date + '/info/info-' + file + '.csv'
    bets = pd.read_csv(file_bets);
    insights = pd.read_csv(file_insights)
    prices = pd.read_csv(file_prices,header=None)


    fig, ax = plt.subplots()
    info = open(file_info, 'r')
    ax.set_title(info.readline(),fontsize=14)
    info.close();
    ax.set_xlabel('TIME',fontsize=12)
    ax.set_ylabel('PRICE',fontsize=12)

    ax2 = ax.twinx()

    #ax.scatter(bets['placedDateSeconds'], bets['backPriceRequested'], s=200, c='#89B9EF', alpha=0.8 )
    #ax.scatter(bets['placedDateSeconds'], bets['layPriceRequested'], s=200, c='#E7A7B7', alpha=0.8 )
    #ax.scatter(bets['matchedDateSeconds'], bets['priceMatched'], s=50, c='g', alpha=0.5 )
    ax.plot(prices[0], prices[1], c='b', alpha=0.5)
    ax2.axhline(0, linestyle='--', color='k')
    ax2.plot(insights['lastMatchTimeSeconds'], insights['backValue'], c='#E7A7B7', alpha=1.0)
    ax2.plot(insights['lastMatchTimeSeconds'], insights['layValue'], c='#89B9EF', alpha=1.0)
    #ax2.plot(insights['lastMatchTimeSeconds'], insights['backTotal15'], c='y', alpha=1.0)
    #ax2.plot(insights['lastMatchTimeSeconds'], insights['layTotal15'], c='y', alpha=1.0)
    #ax2.scatter(markets['matchedDateSeconds'], markets['profit'], s=50, c='r', alpha=0.5 )
    #ax2.scatter(markets['matchedDateSeconds'], markets['back'], s=50, c='y', alpha=0.5 )
    #ax2.scatter(markets['matchedDateSeconds'], markets['lay'], s=50, c='y', alpha=0.5 )

    fig.savefig(data_dir + '/data/' + todays_date + '/charts/insights-chart-' + file + '.png', dpi=80)
    plt.close()
