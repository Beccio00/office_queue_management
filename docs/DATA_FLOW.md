# Display Real-time Update - 数据流程图

## 完整的数据流程

### 1. 初始连接阶段

```
┌──────────┐              ┌──────────┐              ┌──────────┐
│ Display  │              │  Server  │              │ Database │
│  屏幕    │              │  后端    │              │  数据库  │
└──────────┘              └──────────┘              └──────────┘
     │                          │                          │
     │ 1. 建立WebSocket连接      │                          │
     │─────────────────────────>│                          │
     │                          │                          │
     │ 2. 加入'displays'房间     │                          │
     │─────────────────────────>│                          │
     │                          │                          │
     │                          │ 3. 查询初始数据           │
     │                          │─────────────────────────>│
     │                          │                          │
     │                          │ 4. 返回队列状态           │
     │                          │<─────────────────────────│
     │                          │                          │
     │ 5. 发送初始数据            │                          │
     │<─────────────────────────│                          │
     │                          │                          │
     │ 6. 渲染UI显示数据          │                          │
     │                          │                          │
```

### 2. Officer叫号阶段

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ Officer  │         │  Server  │         │ Database │         │ Display  │
│  界面    │         │  后端    │         │  数据库  │         │  屏幕    │
└──────────┘         └──────────┘         └──────────┘         └──────────┘
     │                    │                     │                     │
     │ ① 点击              │                     │                     │
     │ "Call Next"        │                     │                     │
     │                    │                     │                     │
     │ ② POST             │                     │                     │
     │ /api/queue/next    │                     │                     │
     │───────────────────>│                     │                     │
     │                    │                     │                     │
     │                    │ ③ 查询下一个票号      │                     │
     │                    │ SELECT * FROM       │                     │
     │                    │ tickets WHERE       │                     │
     │                    │ status='waiting'    │                     │
     │                    │ ORDER BY timestamp  │                     │
     │                    │ LIMIT 1             │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │ ④ 返回票号A002       │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │ ⑤ 更新票据状态        │                     │
     │                    │ UPDATE tickets      │                     │
     │                    │ SET status='serving'│                     │
     │                    │ WHERE id='A002'     │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │ ⑥ 更新成功            │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │                    │ ⑦ 查询完整Display数据 │                     │
     │                    │ (当前服务票、下一批、 │                     │
     │                    │  队列状态、柜台状态)  │                     │
     │                    │────────────────────>│                     │
     │                    │                     │                     │
     │                    │ ⑧ 返回完整数据        │                     │
     │                    │<────────────────────│                     │
     │                    │                     │                     │
     │ ⑨ 返回票据给Officer  │                     │                     │
     │<───────────────────│                     │                     │
     │                    │                     │                     │
     │ ⑩ Officer UI更新   │                     │                     │
     │ 显示"正在服务A002"  │                     │                     │
     │                    │                     │                     │
     │                    │ ⑪ WebSocket广播       │                     │
     │                    │ io.to('displays')   │                     │
     │                    │ .emit('queue-update',│                     │
     │                    │       displayData)  │                     │
     │                    │─────────────────────────────────────────>│
     │                    │                     │                     │
     │                    │                     │                     │ ⑫ Display收到消息
     │                    │                     │                     │ socket.on('queue-update')
     │                    │                     │                     │
     │                    │                     │                     │ ⑬ 更新React状态
     │                    │                     │                     │ setDisplayInfo(data)
     │                    │                     │                     │
     │                    │                     │                     │ ⑭ React重新渲染
     │                    │                     │                     │ - 当前服务: A002
     │                    │                     │                     │ - 柜台号: #1
     │                    │                     │                     │ - 下一批顾客更新
     │                    │                     │                     │
```

## 详细步骤说明

### Officer端流程

```javascript
// Step 1: 用户点击按钮
<Button onClick={handleCallNextCustomer}>
  Call Next Customer
</Button>

// Step 2: 发送HTTP请求
const handleCallNextCustomer = async () => {
  const response = await fetch('/api/queue/next', {
    method: 'POST',
    body: JSON.stringify({ counterId: 1 })
  });
  
  const ticket = await response.json();
  
  // Step 3: 更新本地状态
  setCurrentTicket(ticket);
};
```

### Backend端流程

```javascript
// Step 4: 接收请求
app.post('/api/queue/next', async (req, res) => {
  const { counterId } = req.body;
  
  // Step 5: 从数据库获取下一个票号
  const nextTicket = await db.tickets.findFirst({
    where: { status: 'waiting' },
    orderBy: { timestamp: 'asc' }
  });
  
  // Step 6: 更新票据状态
  await db.tickets.update({
    where: { id: nextTicket.id },
    data: { 
      status: 'serving',
      counterId: counterId,
      calledAt: new Date()
    }
  });
  
  // Step 7: 获取完整的Display数据
  const displayData = {
    currentTicket: nextTicket,
    nextTickets: await getNextTickets(),
    queueStatus: await getQueueStatus(),
    counters: await getCounterStatus(),
    lastUpdated: new Date()
  };
  
  // Step 8: 通过WebSocket广播给所有Display
  io.to('displays').emit('queue-update', displayData);
  
  // Step 9: 返回响应给Officer
  res.json(nextTicket);
});
```

### Display端流程

```javascript
// Step 10: Display监听WebSocket消息
useEffect(() => {
  const socket = io('http://localhost:3000');
  
  // 连接成功后加入房间
  socket.on('connect', () => {
    socket.emit('join-display');
  });
  
  // Step 11: 监听队列更新
  socket.on('queue-update', (data) => {
    console.log('收到更新:', data);
    
    // Step 12: 更新React状态
    setDisplayInfo(data);
    
    // Step 13: React自动重新渲染UI
    // 无需额外代码，React会自动检测状态变化
  });
  
  return () => socket.close();
}, []);

// Step 14: 渲染UI
return (
  <div>
    <h1>Currently Serving</h1>
    <h2>{displayInfo.currentTicket.id}</h2>
    <p>Please go to Counter #{displayInfo.currentTicket.counterId}</p>
  </div>
);
```

## 多Display同步

```
┌──────────┐
│ Display1 │────┐
└──────────┘    │
                │
┌──────────┐    │     ┌──────────┐        ┌──────────┐
│ Display2 │────┼────>│  Server  │<───────│ Officer  │
└──────────┘    │     │(WebSocket)│       └──────────┘
                │     └──────────┘
┌──────────┐    │           │
│ Display3 │────┘           │ 广播给所有
└──────────┘                │ 在'displays'
                            │ 房间的客户端
                            ↓
                     所有Display同时更新
```

### 房间机制

```javascript
// 后端 - Socket.IO房间管理
io.on('connection', (socket) => {
  
  // Display加入displays房间
  socket.on('join-display', () => {
    socket.join('displays');
    console.log('Display加入，房间内客户端数:', 
                io.sockets.adapter.rooms.get('displays').size);
  });
  
  // Officer加入officer房间
  socket.on('join-officer', (officerId) => {
    socket.join('officer-room');
    socket.join(`officer-${officerId}`); // 个人房间
  });
});

// 广播到特定房间
io.to('displays').emit('queue-update', data);  // 只有Display收到
io.to('officer-room').emit('notification', msg); // 只有Officer收到
```

## 数据结构

### DisplayInfo 数据格式

```typescript
{
  currentTicket: {
    id: "A002",
    serviceType: "SHIPPING",
    timestamp: "2025-10-12T04:07:04.000Z",
    status: "serving",
    counterId: 1
  },
  nextTickets: [
    { id: "A003", serviceType: "ACCOUNT", status: "waiting" },
    { id: "A004", serviceType: "DEPOSIT", status: "waiting" },
    { id: "A005", serviceType: "SHIPPING", status: "waiting" },
    { id: "A006", serviceType: "ACCOUNT", status: "waiting" }
  ],
  queueStatus: [
    { serviceType: "DEPOSIT", length: 8, estimatedWaitTime: 15 },
    { serviceType: "SHIPPING", length: 5, estimatedWaitTime: 25 },
    { serviceType: "ACCOUNT", length: 3, estimatedWaitTime: 20 }
  ],
  counters: [
    { 
      id: 1, 
      number: 1, 
      availableServices: ["DEPOSIT", "ACCOUNT"],
      status: "serving",
      currentTicket: "A002"
    },
    { 
      id: 2, 
      number: 2, 
      availableServices: ["SHIPPING", "DEPOSIT"],
      status: "available"
    },
    { 
      id: 3, 
      number: 3, 
      availableServices: ["ACCOUNT", "SHIPPING"],
      status: "available"
    }
  ],
  lastUpdated: "2025-10-12T04:12:10.000Z"
}
```

## 时间线示例

```
时间轴 (毫秒)
│
0ms   │ Officer点击"Call Next"按钮
      │
10ms  │ HTTP请求到达后端
      │
15ms  │ 数据库查询开始
      │
25ms  │ 数据库返回票号A002
      │
30ms  │ 更新票据状态为'serving'
      │
40ms  │ 构建完整DisplayInfo数据
      │
45ms  │ WebSocket广播消息
      │
50ms  │ Display1收到消息 ← 几乎同时
      │ Display2收到消息
      │ Display3收到消息
      │
52ms  │ 所有Display的React状态更新
      │
55ms  │ 所有Display的UI重新渲染完成
      │
60ms  │ HTTP响应返回给Officer
      │
65ms  │ Officer界面更新
      │
      ↓
```

**总延迟：约50-60毫秒** ⚡

## 断线重连机制

```
┌──────────┐                    ┌──────────┐
│ Display  │                    │  Server  │
└──────────┘                    └──────────┘
     │                                │
     │ ① 正常连接                      │
     │<──────────────────────────────>│
     │                                │
     │ ② 网络断开                      │
     │xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     │                                
     │ ③ 自动重连 (尝试1)              
     │────────────────────────────────>
     │                                
     │ ④ 重连失败                      
     │                                
     │ ⑤ 自动重连 (尝试2，延迟1秒)     
     │────────────────────────────────>
     │                                │
     │ ⑥ 重连成功                      │
     │<──────────────────────────────>│
     │                                │
     │ ⑦ 重新加入房间                  │
     │────────────────────────────────>│
     │                                │
     │ ⑧ 接收最新数据                  │
     │<────────────────────────────────│
     │                                │
     │ ⑨ 继续监听更新                  │
     │                                │
```

### 重连配置

```javascript
const socket = io('http://localhost:3000', {
  reconnection: true,           // 启用自动重连
  reconnectionDelay: 1000,      // 重连延迟1秒
  reconnectionAttempts: 10,     // 最多尝试10次
  timeout: 5000                 // 连接超时5秒
});

socket.on('reconnect', (attemptNumber) => {
  console.log('重连成功，尝试次数:', attemptNumber);
  // 重新加入房间
  socket.emit('join-display');
});

socket.on('reconnect_failed', () => {
  console.log('重连失败，启用备用方案');
  // 启用HTTP轮询作为备用
  startPolling();
});
```

## 总结

### 关键点

✅ **WebSocket提供实时双向通信**
✅ **房间机制实现精准推送**
✅ **React状态管理触发UI更新**
✅ **自动重连保证可靠性**
✅ **整个流程延迟<100ms**

### 优势

- ⚡ **实时性强** - 无延迟，即时更新
- 🔄 **自动同步** - 所有Display同时更新
- 💪 **可靠性高** - 自动重连，fallback机制
- 📊 **可扩展** - 支持无限多个Display屏幕
- 🎯 **精准推送** - 房间机制避免广播浪费
