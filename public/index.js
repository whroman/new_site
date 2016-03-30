document.getElementById("project-header").addEventListener("click", function (event) {
    var toShow = document.querySelectorAll(".projects-list");
    for (var iter = 0; iter < toShow.length; iter++) {
        toShow[iter].classList.toggle("hide");
    }
    event.preventDefault();
});