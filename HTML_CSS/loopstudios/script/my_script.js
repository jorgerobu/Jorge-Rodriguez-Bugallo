const $d=document,
$hamburger=$d.querySelector(".hamburger"),
$close=$d.querySelector(".close"),
$mobile=$d.querySelector(".nav_mobile")

$hamburger.addEventListener("click",ev=>{
    $mobile.classList.add("mostrar")
})

$close.addEventListener("click", ev=>{
    $mobile.classList.remove("mostrar")
})