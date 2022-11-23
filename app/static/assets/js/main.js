const ws = new WebSocket("ws://localhost:3001");
ws.addEventListener("open", () => {
    console.log("We are connected");
    ws.send("How are you?");
});

ws.addEventListener('message', function (event) {
    const responseData = JSON.parse(event.data);

    console.log(event.data);
    var notifyAudio = document.getElementById("notifyAudio"); 

    if (responseData.type != "GIFT")
        return;

    notifyAudio.play();
    iziToast.show({
        theme: 'light',
        color: 'red',
        icon: 'icon-contacts',
        title: 'ADA GIFT DATANG!!',
        displayMode: 0,
        message: `${responseData.author} telah memberikan gift <b>${responseData.giftType}</b> sebanyak ${responseData.giftCount}`,
        position: 'topLeft',
        transitionIn: 'flipInX',
        transitionOut: 'flipOutX',
        timeout: 7000,
        progressBarColor: 'rgb(0, 255, 184)',
        image: responseData.images,
        imageWidth: 70,
        layout: 2,
        iconColor: 'rgb(0, 255, 184)'
    });
});