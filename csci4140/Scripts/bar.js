$(function () {
    $(".meter > span").each(function () {
        $(this)
            .data("origWidth", $(this).width())
            .width(0)
            .animate({
                width: $(this).data("origWidth")
            }, 1200);
    });
});

var maxEnergy = 1000;
var lastEnergy = 0;
var energy = 0;
var bar;
var percent;


function initBar() {
    bar = document.getElementById("bar");
    percent = document.getElementById("percent");
    setInterval(function () {
        energy += 1;
    }, 1000);

    setInterval(updateBar, 1000);
}

function updateBar() {
    var addEnergy = game.cover * 4 - lastEnergy;
    energy += addEnergy;
    lastEnergy = game.cover * 4;
    if (energy >= maxEnergy) {
        energy = maxEnergy;
    }
    energy = parseInt(energy);
    var width = 100 * energy / maxEnergy;
    percent.innerHTML = energy + "/" + maxEnergy;
    bar.style.width = width + "%";
}

function decreaseEnergy(decEnergy) {
    energy -= decEnergy;
}

window.addEventListener("load", initBar, false);