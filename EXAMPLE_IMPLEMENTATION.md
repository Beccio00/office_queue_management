# Display Real-time Update - Quick Example

## 简化示例：如何实现实时更新

### 场景说明

当Officer点击"Call Next Customer"按钮时，Display屏幕会自动显示新的票号和柜台信息。

---

## 最简单的实现方式

### 方案一：使用 Socket.IO (推荐)

#### 1. 安装依赖

```bash
# 后端
cd server
npm install socket.io

# 前端
cd client
npm install socket.io-client
```

#### 2. 后端代码 (server/src/index.ts)

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// 存储当前队列状态
let queueState = {
  currentTicket: { id: 'A001', serviceType: 'DEPOSIT', counterId: 1 },
  nextTickets: [
    { id: 'A002', serviceType: 'SHIPPING' },
    { id: 'A003', serviceType: 'ACCOUNT' },
  ],
  lastUpdated: new Date()
};

// WebSocket连接管理
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  // Display屏幕加入房间
  socket.on('join-display', () => {
    socket.join('displays');
    // 发送初始数据
    socket.emit('queue-update', queueState);
  });

  // Officer加入房间
  socket.on('join-officer', (officerId) => {
    socket.join(`officer-${officerId}`);
  });

  socket.on('disconnect', () => {
    console.log('客户端断开:', socket.id);
  });
});

// API: Officer叫号
app.post('/api/queue/next', (req, res) => {
  const { counterId } = req.body;

  // 1. 更新队列状态（实际应该从数据库读取）
  const newCurrent = queueState.nextTickets[0];
  queueState.currentTicket = {
    ...newCurrent,
    counterId,
    status: 'serving'
  };
  queueState.nextTickets = queueState.nextTickets.slice(1);
  queueState.lastUpdated = new Date();

  // 2. 广播到所有Display屏幕 ⭐ 关键步骤
  io.to('displays').emit('queue-update', queueState);

  // 3. 返回响应
  res.json(queueState.currentTicket);
});

httpServer.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

#### 3. Display组件 (client/src/pages/display/display.tsx)

```typescript
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const Display = () => {
  const [displayInfo, setDisplayInfo] = useState(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // 1. 连接到WebSocket服务器
    const newSocket = io('http://localhost:3000');

    // 2. 连接成功后加入display房间
    newSocket.on('connect', () => {
      console.log('✅ 已连接到服务器');
      newSocket.emit('join-display');
    });

    // 3. 监听队列更新事件 ⭐ 关键步骤
    newSocket.on('queue-update', (data) => {
      console.log('📢 收到队列更新:', data);
      setDisplayInfo(data); // 更新状态，UI自动刷新
    });

    // 4. 监听断开连接
    newSocket.on('disconnect', () => {
      console.log('❌ 与服务器断开连接');
    });

    setSocket(newSocket);

    // 5. 组件卸载时断开连接
    return () => {
      newSocket.close();
    };
  }, []);

  if (!displayInfo) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h1>当前服务</h1>
      <h2>{displayInfo.currentTicket.id}</h2>
      <p>请到柜台 #{displayInfo.currentTicket.counterId}</p>
      
      <h3>下一个顾客</h3>
      {displayInfo.nextTickets.map(ticket => (
        <div key={ticket.id}>{ticket.id}</div>
      ))}
    </div>
  );
};
```

#### 4. Officer组件 (client/src/pages/officer/officer.tsx)

```typescript
import { useState } from 'react';

const Officer = () => {
  const [currentTicket, setCurrentTicket] = useState(null);

  // Officer点击"叫下一个顾客"
  const handleCallNext = async () => {
    try {
      // 调用后端API
      const response = await fetch('http://localhost:3000/api/queue/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId: 1 })
      });

      const ticket = await response.json();
      setCurrentTicket(ticket);

      // ⭐ Display屏幕会自动收到更新，不需要额外操作！
      console.log('✅ 已叫号:', ticket.id);

    } catch (error) {
      console.error('❌ 叫号失败:', error);
    }
  };

  return (
    <div>
      <h1>Officer界面</h1>
      <button onClick={handleCallNext}>
        叫下一个顾客
      </button>
      
      {currentTicket && (
        <div>
          <h3>当前服务: {currentTicket.id}</h3>
        </div>
      )}
    </div>
  );
};
```

---

## 工作流程

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Officer   │                    │   Backend   │                    │   Display   │
│    界面     │                    │   Server    │                    │    屏幕     │
└─────────────┘                    └─────────────┘                    └─────────────┘
      │                                   │                                   │
      │ 1. 用户点击"叫下一个顾客"           │                                   │
      │────────────────────────────>      │                                   │
      │    POST /api/queue/next           │                                   │
      │                                   │                                   │
      │                                   │ 2. 更新队列数据                    │
      │                                   │    (从数据库获取最新状态)          │
      │                                   │                                   │
      │                                   │ 3. 通过WebSocket广播              │
      │                                   │    io.to('displays')              │
      │                                   │    .emit('queue-update', data)    │
      │                                   │──────────────────────────────────>│
      │                                   │                                   │
      │ 4. 返回票据信息                    │                                   │ 5. UI自动更新
      │<────────────────────────────      │                                   │    显示新的票号
      │                                   │                                   │    和柜台号
      │ 5. Officer界面更新                 │                                   │
      │    显示当前服务的票号               │                                   │
```

---

## 关键点说明

### 1. 为什么Display会自动更新？

```typescript
// Display组件监听'queue-update'事件
socket.on('queue-update', (data) => {
  setDisplayInfo(data); // ⭐ React状态更新
});
// 当状态改变时，React会自动重新渲染组件
```

### 2. 数据流向

```
Officer点击按钮 
  → 发送HTTP请求到后端 
  → 后端更新数据库 
  → 后端通过WebSocket广播 
  → Display收到消息 
  → Display更新React状态 
  → UI自动刷新
```

### 3. 房间机制

```typescript
// 后端使用"房间"来分组客户端
socket.join('displays');  // Display屏幕加入displays房间

// 广播只发送给特定房间
io.to('displays').emit('queue-update', data);  // 只有Display收到
```

---

## 方案二：Server-Sent Events (SSE) - 更简单但单向

如果只需要从服务器推送到Display（Display不需要发送数据），可以用SSE：

### 后端

```typescript
app.get('/api/stream/display', (req, res) => {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 保存客户端连接
  clients.push(res);

  // 客户端断开时移除
  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

// Officer叫号时推送
app.post('/api/queue/next', (req, res) => {
  const data = updateQueue();
  
  // 推送到所有Display
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
  
  res.json(data);
});
```

### 前端

```typescript
useEffect(() => {
  const eventSource = new EventSource('http://localhost:3000/api/stream/display');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setDisplayInfo(data); // ⭐ UI自动更新
  };

  return () => eventSource.close();
}, []);
```

---

## 方案三：定时轮询 (Polling) - 最简单但效率低

如果不想用WebSocket，可以定时请求：

```typescript
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch('/api/display/status');
    const data = await response.json();
    setDisplayInfo(data);
  };

  // 初始加载
  fetchData();

  // 每3秒刷新一次
  const interval = setInterval(fetchData, 3000);

  return () => clearInterval(interval);
}, []);
```

**缺点**：
- ❌ 延迟较大（最多3秒）
- ❌ 服务器负载高（大量无用请求）
- ❌ 不够实时

---

## 对比三种方案

| 方案 | 实时性 | 复杂度 | 适用场景 | 推荐度 |
|-----|--------|--------|----------|--------|
| **WebSocket** | ⭐⭐⭐⭐⭐ | 中等 | 需要双向通信 | ✅ 强烈推荐 |
| **SSE** | ⭐⭐⭐⭐ | 简单 | 只需服务器推送 | ✅ 推荐 |
| **Polling** | ⭐⭐ | 很简单 | 测试/原型 | ⚠️ 不推荐生产 |

---

## 快速测试

1. **启动后端**
```bash
cd server
npm run dev
```

2. **打开两个浏览器标签**
   - 标签1: `http://localhost:5173/officer`
   - 标签2: `http://localhost:5173/display`

3. **在Officer标签点击"Call Next Customer"**

4. **观察Display标签自动更新** ✨

---

## 常见问题

### Q1: Display多久更新一次？
**A**: 实时更新！只要Officer点击按钮，Display立即收到消息并更新UI。

### Q2: 如果网络断开了怎么办？
**A**: Socket.IO会自动重连。也可以添加fallback轮询：
```typescript
if (!socket.connected) {
  // 使用定时轮询作为备份
  setInterval(() => fetch('/api/display/status'), 5000);
}
```

### Q3: 多个Display屏幕会同时更新吗？
**A**: 是的！所有连接到`displays`房间的屏幕都会同时收到更新。

### Q4: 会有延迟吗？
**A**: WebSocket延迟通常<100ms，几乎是即时的。

---

## 总结

✅ **WebSocket是最佳选择** - 实时、双向、高效

✅ **关键是广播机制** - Officer操作 → 后端广播 → Display接收

✅ **React自动更新** - 状态改变 → UI重新渲染

✅ **测试很简单** - 两个浏览器窗口就能看到效果

---

更多细节请查看 [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
