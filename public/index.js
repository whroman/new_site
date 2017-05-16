document.getElementById("project-header").addEventListener("click", function (event) {
    var toShow = document.querySelectorAll(".projects-list");
    var iter = toShow.length;
    while (iter--) {
        toShow[iter].classList.toggle("hide");
    }
    event.preventDefault();
});