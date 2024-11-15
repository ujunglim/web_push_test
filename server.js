// SSL 인증서 검증 비활성화 (개발 환경에서만 사용)
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var webpush = require("web-push");
const express = require("express");
const https = require("https");
const fs = require("fs");

var cors = require("cors");

const port = process.env.PORT || 4999;

const app = express();

app.use(cors()); //cross origin 허용
app.use(express.json()); //json사용
app.use(express.urlencoded({ extended: true })); //body-parse사용

app.use("/client", express.static("client")); //구독 페이지
app.use("/sketcher", express.static("sketcher")); //Push 전송 페이지

app.get("/", (req, res) => {
  res.send("Web Push Server");
});

const options = {
  cert: fs.readFileSync("/Users/hani/localhost+2.pem"),
  key: fs.readFileSync("/Users/hani/localhost+2-key.pem"),
};

const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  "mailto:transpine@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 1. service-worker의 pushManager가 Registration을 하기 위한  키를 받아오는 GET
app.get("/push/key", (req, res) => {
  console.log(`publick key sent: ${vapidKeys.publicKey}`);
  res.send({
    key: vapidKeys.publicKey,
  });
});

// 2. 구독 POST
const temp_subs = [];
app.post("/push/subscribe", (req, res) => {
  temp_subs.push(req.body.subscription);
  console.log(`subscribed : ${JSON.stringify(req.body.subscription)}`);
  res.send("Subscribed");
});

// 3. 등록된 브라우저 들에게 푸시를 보내는 POST
app.post("/push/notify", (req, res) => {
  console.log(`----------------- SERVER --------------------------`);
  console.log(`notify requested : ${JSON.stringify(req.body)}`);

  let payload = {};
  payload.title = req.body.title;
  payload.message = req.body.message;

  for (const subs of temp_subs) {
    webpush
      .sendNotification(subs, JSON.stringify(payload))
      .then((response) => {
        console.log("sent notification");
        res.sendStatus(201);
      })
      .catch((err) => {
        console.error(`notification error : ${err}`);
        res.sendStatus(500);
      });
  }
});

// https.createServer(options, app).listen(port, () => {
//   console.log(`webpush server running, port:${port}`);
// });

// =============== SSE ===============

const corsOptions = {
  // origin: "http://localhost:8080",
  origin: "http://machost:8080", // cors
};

// SSE 엔드포인트
app.get("/sse", cors(corsOptions), (req, res) => {
  // 헤더 설정
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // 클라이언트 연결이 유지되는 동안 데이터 푸시
  const interval = setInterval(() => {
    const data = JSON.stringify({
      message: "Hello from server!",
      timestamp: new Date(),
    });
    res.write(`data: ${data}\n\n`);
  }, 1000);

  // 연결이 종료되었을 때
  req.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
