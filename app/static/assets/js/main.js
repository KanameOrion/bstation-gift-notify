const ws = new WebSocket("ws://localhost:3001");
let appConfig;

ws.addEventListener("open", () => {
    console.log("We are connected");
    ws.send(JSON.stringify({
        type: "REQUEST",
        id: "INITGIFTNOTIFY",
        content: {},
    }));
});

ws.addEventListener('message', function (event) {
    const responseData = JSON.parse(event.data);
    console.log(event.data);

    if (responseData.type != 'GIFTNOTIFYCONTENT')
        return;

    var notifyAudio = document.getElementById("notifyAudio"); 

    if (responseData.content.type != "GIFT")
        return;

    notifyAudio.play();
    iziToast.show({
        theme: 'light',
        color: 'red',
        icon: 'icon-contacts',
        title: 'ADA GIFT DATANG!!',
        displayMode: 0,
        message: `${responseData.content.author} telah memberikan gift <b>${responseData.content.giftType}</b> sebanyak ${responseData.content.giftCount}`,
        position: 'topLeft',
        transitionIn: 'flipInX',
        transitionOut: 'flipOutX',
        timeout: 7000,
        progressBarColor: 'rgb(0, 255, 184)',
        image: responseData.content.images,
        imageWidth: 70,
        layout: 2,
        iconColor: 'rgb(0, 255, 184)'
    });
});