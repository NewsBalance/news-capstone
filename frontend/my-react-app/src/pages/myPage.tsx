// src/App.tsx
import React, { useState, useEffect } from 'react';
import * as echarts from 'echarts';

const BRAND = {
  purple: '#5F3DC4',
  purpleHover: '#4D2F9A',
  gray200: 'bg-gray-200',
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [storiesChart, setStoriesChart] = useState<echarts.ECharts | null>(null);

  // 1) Stories Read 차트
  useEffect(() => {
    if (!storiesChart) {
      const dom = document.getElementById('stories-chart');
      if (dom) setStoriesChart(echarts.init(dom));
    } else {
      updateStoriesChart();
      const onResize = () => storiesChart.resize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [storiesChart, activeTab]);

  const updateStoriesChart = () => {
    if (!storiesChart) return;
    const count = activeTab === 'Day' ? 30 : activeTab === 'Week' ? 20 : 12;
    const data = Array.from({ length: count }, () => Math.floor(Math.random() * 30) + 1);
    const labels =
      activeTab === 'Day'
        ? ['Apr 1','Apr 5','Apr 9','Apr 13','Apr 17','Apr 21','Apr 25','Apr 29']
        : activeTab === 'Week'
        ? ['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5']
        : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    storiesChart.setOption({
      animation: false,
      grid: { top: 20, right: 20, bottom: 30, left: 40 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#666', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#eee' } },
        axisLabel: { color: '#666' },
      },
      series: [
        {
          type: 'bar',
          data,
          barWidth: activeTab === 'Day' ? 6 : activeTab === 'Week' ? 10 : 14,
          itemStyle: { color: BRAND.purple, opacity: 0.8 },
          emphasis: { itemStyle: { opacity: 1 } },
        },
      ],
    });
  };

  // 2) Locality Bias 차트
  const createLocalityBiasChart = () => {
    const dom = document.getElementById('locality-bias-chart');
    if (!dom) return;
    const chart = echarts.init(dom);
    chart.setOption({
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: 'value', show: false, max: 100 },
      yAxis: { type: 'category', show: false, data: [''] },
      series: [
        { name: 'Local',   type: 'bar', stack: 'total', data: [7],  itemStyle: { color: '#FFFFFF' }, barWidth: 20 },
        { name: 'National',type: 'bar', stack: 'total', data: [50], itemStyle: { color: '#E6D9A8' }, barWidth: 20 },
        { name: 'Intl',    type: 'bar', stack: 'total', data: [43], itemStyle: { color: '#888888' }, barWidth: 20 },
      ],
    });
  };

  // 3) Factuality Distribution 차트
  const createFactualityChart = () => {
    const dom = document.getElementById('factuality-chart');
    if (!dom) return;
    const chart = echarts.init(dom);
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'pie',
          radius: ['70%', '90%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: { label: { show: false } },
          data: [
            { value: 86, name: 'High', itemStyle: { color: '#333333' } },
            { value: 14, name: 'Other', itemStyle: { color: '#555555' } },
          ],
        },
      ],
    });
  };

  // 4) Blindspot Stories 차트
  const createBlindspotChart = () => {
    const dom = document.getElementById('blindspot-chart');
    if (!dom) return;
    const chart = echarts.init(dom);
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'pie',
          radius: '90%',
          label: {
            show: true,
            position: 'inside',
            formatter: '{c}%',
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
          },
          data: [
            { value: 35, name: 'Left',  itemStyle: { color: '#8B2E2E' } },
            { value: 65, name: 'Right', itemStyle: { color: '#2E4E8B' } },
          ],
        },
      ],
    });
  };

  useEffect(() => {
    createLocalityBiasChart();
    createFactualityChart();
    createBlindspotChart();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-bold" style={{ color: BRAND.purple }}>
            NewsBalance
          </a>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="/"       className="pb-1 border-b-2 border-transparent hover:border-current">홈</a></li>
              <li><a href="/forum"  className="pb-1 border-b-2 border-transparent hover:border-current">토론장</a></li>
              <li><a href="/mypage" className="pb-1 border-b-2" style={{ borderColor: BRAND.purple, color: BRAND.purple }}>마이페이지</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 space-y-8">
        {/* Top Row: Profile + Stories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                <img
                  src="https://readdy.ai/api/search-image?query=The%20Thinker"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-medium mb-1">Isaac S.</h2>
              <p className="text-gray-600 mb-4">319 Stories · 79 Articles</p>
              <div className="w-full h-4 rounded-sm overflow-hidden mb-4 flex">
                <div className="bg-red-600 w-1/3 flex items-center justify-center text-xs text-white">L 33%</div>
                <div className="bg-gray-300 w-1/2 flex items-center justify-center text-xs text-gray-800">C 49%</div>
                <div className="bg-blue-700 w-1/6 flex items-center justify-center text-xs text-white">R 18%</div>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>104</strong> stories lean left</li>
                <li>• <strong>157</strong> stories balanced</li>
                <li>• <strong>57</strong> stories lean right</li>
              </ul>
            </div>
          </div>

          {/* Stories Read Card */}
          <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium flex items-center">
                <i className="fas fa-file-alt mr-2"></i>Stories Read
              </h3>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                {(['Day','Week','Month'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1 whitespace-nowrap ${
                      activeTab === tab
                        ? `bg-[${BRAND.purple}] text-white`
                        : 'bg-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div id="stories-chart" className="w-full h-64"></div>
            <p className="mt-4 text-center text-gray-700">
              You've read <span className="text-[${BRAND.purple}] font-semibold">41%</span> more stories than last week
            </p>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="space-y-8">
          {/* Most Read News Sources */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-trophy mr-2"></i>Most Read News Sources
            </h4>
            <div className="flex space-x-6 mb-6">
              {['All','Left','Center','Right'].map(tab => (
                <button
                  key={tab}
                  className={`pb-1 ${tab==='All'?'border-b-2 border-[${BRAND.purple}] text-[${BRAND.purple}]':'text-gray-500 hover:text-gray-800'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              {['THE HILL','SUN','VOA','TOWER','NY POST'].map((source, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${i===0?'bg-blue-200':i===1?'bg-yellow-100':i===2?'bg-blue-100':i===3?'bg-red-100':'bg-blue-100'}`}>
                    {source.match(/[A-Z]/g)?.length && (
                      <span className="text-lg font-bold text-gray-800">{source}</span>
                    )}
                    {source==='SUN' && <i className="fas fa-sun text-yellow-600 text-2xl"></i>}
                    {source==='TOWER' && <i className="fas fa-broadcast-tower text-red-600 text-2xl"></i>}
                  </div>
                  <span className="text-gray-700">{['4','4','3','3','2'][i]}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="text-gray-700">
                <strong>3%</strong> of the news organizations you read are owned by <strong>Nexstar Media Group</strong>
              </p>
            </div>
          </div>

          {/* Article Bias */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-newspaper mr-2"></i>Article Bias
            </h4>
            <p className="text-gray-700 mb-4">
              When browsing stories you most frequently selected <strong>articles</strong> from sources rated <strong>center</strong>.
            </p>
            <div className="relative h-48 mb-4">
              <div className="flex h-full">
                {[
                  {label:'FAR LEFT', pct:1, color:'bg-red-800'},
                  {label:'LEFT', pct:3, color:'bg-red-600'},
                  {label:'LEAN LEFT', pct:31, color:'bg-red-300'},
                  {label:'CENTER', pct:55, color:'bg-gray-200'},
                  {label:'LEAN RIGHT', pct:9, color:'bg-blue-300'},
                  {label:'RIGHT', pct:1, color:'bg-blue-600'},
                  {label:'FAR RIGHT', pct:1, color:'bg-blue-800'},
                ].map((seg, i) => (
                  <div key={i} className="flex-1 relative">
                    <div style={{ height: `${seg.pct}%` }} className={`${seg.color} absolute bottom-0 left-0 right-0 rounded-t-sm`}></div>
                    <div className="absolute bottom-0 left-0 w-full text-center text-xs text-gray-500 -mb-5">{seg.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-gray-700">
              You've read <strong className="text-[${BRAND.purple}]">25%</strong> more articles than last week
            </p>
          </div>

          {/* Factuality Distribution */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-file-alt mr-2"></i>Factuality Distribution
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-gray-700 mb-6">
                  Factuality ratings are done at the outlet level, so this chart tells you how much of the news you read comes from sources with strong reporting practices. <a href="#" className="text-[${BRAND.purple}] underline">Learn more</a>
                </p>
                <ul className="space-y-2">
                  {['Very Low','Low','Mixed','High','Very High'].map((lvl, i) => (
                    <li key={i} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${['bg-gray-600','bg-gray-500','bg-gray-400','bg-gray-300','bg-gray-200'][i]}`}></div>
                      <span className="text-gray-700">{lvl}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div id="factuality-chart" className="w-full h-48"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-4xl font-bold">86%</div>
                  <div className="text-sm text-gray-500">High Factuality</div>
                </div>
              </div>
            </div>
          </div>

          {/* Blindspot Stories */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-eye-slash mr-2"></i>Blindspot Stories
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-gray-700 mb-4">
                  You've read <strong className="text-[${BRAND.purple}]">31%</strong> more blindspots for the right
                </p>
                <div className="flex space-x-6">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#8B2E2E] mr-2"></div>
                    <span className="text-gray-700">Left Blindspots</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#2E4E8B] mr-2"></div>
                    <span className="text-gray-700">Right Blindspots</span>
                  </div>
                </div>
              </div>
              <div id="blindspot-chart" className="w-full h-48"></div>
            </div>
          </div>

          {/* Most Read Topics & People */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-list-alt mr-2"></i>Most Read Topics & People
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium mb-2">Most read subjects</h5>
                <ul className="space-y-2">
                  {[
                    ['Politics','208 Articles'],
                    ['US Politics','164 Articles'],
                    ['North America','102 Articles'],
                    ['Business','80 Articles'],
                    ['Na Politics','68 Articles'],
                  ].map(([sub, cnt], i) => (
                    <li key={i} className="flex justify-between">
                      <span>{sub}</span>
                      <span className="text-gray-600">{cnt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">People you read about</h5>
                <ul className="space-y-2">
                  {[
                    ['Joe Biden','31 Articles'],
                    ['Donald Trump','22 Articles'],
                    ['Elon Musk','14 Articles'],
                    ['Ron DeSantis','11 Articles'],
                    ['Yevgeny Prigozhin','7 Articles'],
                  ].map(([name, cnt], i) => (
                    <li key={i} className="flex justify-between">
                      <span>{name}</span>
                      <span className="text-gray-600">{cnt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Locality Bias */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <i className="fas fa-map-marker-alt mr-2"></i>Locality Bias
            </h4>
            <div id="locality-bias-chart" className="w-full h-6 mb-4"></div>
            <div className="flex justify-center space-x-8 mb-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white rounded-full mr-2"></div>
                <span className="text-gray-700"><strong>7%</strong> Local</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#E6D9A8] rounded-full mr-2"></div>
                <span className="text-gray-700"><strong>50%</strong> National</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-gray-700"><strong>43%</strong> International</span>
              </div>
            </div>
            <p className="text-gray-700">
              When you read the news, only <strong>7%</strong> of your perspective is from <strong>local sources</strong>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
