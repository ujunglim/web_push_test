// 구독버튼 누르면 => 서비스워커 등록하고 => 구독요청 보냄 & 메세지수신 이벤트 추가
function registerPush(appPubkey) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then((registration) => {
      console.log("service worker Registered / getSubscription");

      return registration.pushManager
        .getSubscription()
        .then(function (subscription) {
          if (subscription) {
            return subscription;
          }

          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(appPubkey),
          });
        })
        .then(function (subscription) {
          console.log("post subscription : ", subscription);

          return fetch("https://127.0.0.1:4999/push/subscribe", {
            method: "post",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ subscription: subscription }),
          });
        })
        .catch((error) => {
          console.error(`subscription error : ${error}`);
        });
    })
    .catch(function (err) {
      console.log("Service Worker Failed to Register", err);
    });

  navigator.serviceWorker.addEventListener("message", function (event) {
    console.log("Got Reply from service worker:", event.data);
    document.querySelector(".title").innerText = event.data.title;
    document.querySelector(".message").innerText = event.data.message;
    document.querySelector(".result_image").src = event.data.image_url;
  });
}

function urlBase64ToUint8Array(base64String) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

document.querySelector("#subscribe").onclick = () => {
  if (navigator.serviceWorker) {
    fetch("https://127.0.0.1:4999/push/key")
      .then((e) => e.json())
      .then((result) => {
        document.querySelector("#receivedPubKey").innerText = result.key;
        registerPush(result.key);
      });
  }
};
