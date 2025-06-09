import GridCombobox from "./Combo.js";

const $d=document,
      $form=$d.querySelector("form"),
      $equipos=$form.querySelector("#equipos"),
      $cards=$d.querySelector(".cards"),
      $filtroEquipo=$d.querySelector("#filtro-equipo"),
      $filtro__tallas=$d.querySelector(".filtro__tallas"),
      $confirmar=$d.querySelector("#enviar"),
      $cancelar=$d.querySelector("#cancelar")

const urlTshirt = "http://localhost:3000/tshirts",
        urlTeams = "http://localhost:3000/teams",
        tshirt = [],
        teams = []


function searchEquipos(cad){
   return teams.filter(team=>team.name.toLowerCase().includes(cad.toLowerCase())).map(el=>el.name)
}


function capitalize(cad){
    return cad.toLowerCase().split(" ").filter(el=>el!='').map(el=>el.charAt(0).toUpperCase()+el.slice(1)).join(' ')
}

async function ajax(options){
    const {url,method,data}= options
   
    try{
        let resp=await fetch (url,{
            method:method || "GET",
            header:{"Content-type":"application/json; charset=utf-8"},
            body:JSON.stringify(data)
        })
        if(!resp.ok){
            statusText=resp.statusText || "Ocurrió un error"
            throw new Error(`${resp.status} ${statusText}`)
        }
    
        let json=await resp.json()
    
        return {
            error:false,
            info:json
        }
    }
    catch(msgError){
        return{
        error:true,
        info:msgError
        }
    }
}

function getData(){
    Promise.all([fetch(urlTeams), fetch(urlTshirt)])
    .then(resps=>Promise.all(resps.map(resp=>resp.ok?resp.json():Promise.reject(resp))))
    .then(jsons=>{
        teams.splice(0,teams.length,...jsons[0])
        tshirt.splice(0,tshirt.length,...jsons[1])
        renderTeams(teams)
        renderTshirts(tshirt)
    })
    .catch(errors=>{
        console.log(errors)
    })
}

function renderTshirts(tshirt){
    $cards.innerHTML=tshirt.map((el)=>{
        let team=teams.find((eq)=>eq.id==el.teamId)
        const tallas=Object.keys(el.sizes).reduce((anterior,actual)=>anterior+`<li ${el.sizes[actual]==0?'class="nostock"':""}>${actual}</li>`,'')

        return `<li class="card">
        <figure class="card__img">
          <!-- Imagen de la camiseta: image -->
          <img src="${el.image==""?"../assets/images/producto-sin-imagen.png":el.image}" alt="${el.image}" />
        </figure>
        <h4 class="card__titulo">
          <!-- footballKit -->
          ${el.footballKit}
          <!-- team name -->
          ${team.name}
        </h4>
        <p class="cart__categoria">${el.sexGroup}</p>
        <ul class="card__tallas">
          <!-- Si no hay stock se añade la clase nostock al li correspondiente -->
          ${tallas}
        </ul>
        <p class="card__precio">${el.price}</p>
        <p class="btns">
          <a href="" class="icon--edit" data-id="${el.id}"></a>
          <a href="" class="icon--delete" data-id="${el.id}"></a>
        </p>
      </li>`
    }).join('')
}

function renderTeams(teams){
    $filtroEquipo.innerHTML=`<option value="-1">Cualquiera</option>`
    $filtroEquipo.innerHTML+=teams.map((el)=>`
    <option value="${el.id}">${el.name}</option>`).join('')
}

function filtrarBySize(camisetas){
    let camisetasFiltradas=[],
        camisetasTemp=[]

    let tallas=Array.from($filtro__tallas.querySelectorAll("li.seleccionado")).map(el=>el.textContent)

    if (tallas.length) {
        tallas.forEach(talla=>{
            camisetasTemp=camisetas.filter(el=>el.sizes[talla]>0)
            camisetasTemp.forEach(el=>{
                if (!camisetasFiltradas.includes(el))
                    camisetasFiltradas.push(el)
            })
        })
    } else
       camisetasFiltradas=camisetas
    
    return camisetasFiltradas
}

function filtrarByTeams(camisetas,equipo){
    return equipo>=0?camisetas.filter(el=>el.teamId==equipo):camisetas
}

async function deleteCamiseta(id){
    let json = await ajax({
        url:`${urlTshirt}/${id}`,
        method:"DELETE"
    })

    if(!json.error){
        let index=tshirt.findIndex((el)=>el.id==id)
        tshirt.splice(index,1)
        renderTshirts(tshirt)
    }else{
        alert(json.info)
    }
}

async function updateCamiseta(id){
    const camiseta=tshirt.find(el=>el.id==id)

    const fieldsForm=["eq","sexo","fecha","precio","imagen"]
    const dataJson=["footballKit","sexGroup","date","price","image"]

    fieldsForm.forEach((field,i)=>$form[field].value=camiseta[dataJson[i]])
    $form["si"].checked=camiseta.customizable
    $form["equipo"].value=teams.find(team=>team.id==camiseta["teamId"]).name
    const tam=["U","S","M","L","XL","2XL"]
    tam.forEach(size=>$form[size].value=camiseta.sizes[size])     
    
}

async function addCamiseta(teamId){
   let data={}

   const fieldsForm=["eq","sexo","fecha","precio","imagen"]
   const dataJson=["footballKit","sexGroup","date","price","image"]
   data.customizable=$form["si"].checked?true:false
   fieldsForm.forEach((field,i)=>data[dataJson[i]]=$form[field].value)
   data["teamId"]=teamId
   const tam=["U","S","M","L","XL","2XL"]
   data.sizes={}
   tam.forEach(s=>data.sizes[s]=$form[s].value) 


    let resp=await ajax({
     url:urlTshirt,
     method:"POST",
     data
   })

   if (!resp.error) {
    tshirt.push(resp.info)
    renderTshirts(tshirt)
   } 
}

$filtro__tallas.addEventListener("click", ev=>{
    ev.preventDefault()
    
    if (ev.target.classList.contains("seleccionado")) {
        ev.target.classList.remove("seleccionado")
    } else {
        ev.target.classList.add("seleccionado")
    }

    renderTshirts(filtrarBySize(filtrarByTeams(tshirt,$filtroEquipo.value)))
})

$filtroEquipo.addEventListener("change",ev=>{
    ev.preventDefault()
    renderTshirts(filtrarBySize((filtrarByTeams(tshirt,ev.target.value))))
})

$cards.addEventListener("click", ev=>{
    ev.preventDefault()
    let id = ev.target.dataset.id
    if(id){
        if(ev.target.classList.contains("icon--delete")){
            deleteCamiseta(id)
        }else{
            $confirmar.textContent="Editar"
            $confirmar.setAttribute('data-id',`${id}`)
            
            updateCamiseta(id)
        }
    }
})

$confirmar.addEventListener("click",async ev=>{
    ev.preventDefault()

    
    if(ev.target.textContent=="Editar"){
   
        const fieldsForm=["eq","sexo","fecha","precio","imagen"]
        const dataJson=["footballKit","sexGroup","date","price","image"]
        const tam=["U","S","M","L","XL","2XL"]
        let data={},
        id=$confirmar.dataset.id
        data.customizable=$form["si"].checked?true:false
        fieldsForm.forEach((field,i)=>data[dataJson[i]]=$form[field].value)
        data.teamId=teams.find(team=>team.name==$form["equipo"].value).id
        data.sizes={} 
        tam.forEach(s=>data.sizes[s]=$form[s].value) 

        let json = await ajax({
            url:`${urlTshirt}/${id}`,
            method:"PATCH",
            data
        })

        if(!json.error){
            let index=tshirt.findIndex(el=>el.id==id)
            tshirt.splice(index,1,json.info)
            renderTshirts(tshirt)
            $confirmar.textContent="Añadir"
            $form.reset()
        }else{
            $confirmar.textContent="Añadir"
            alert("Error al actualizar el registro")
        }

    }else{
        let equipo=teams.find(el=>el.name.toLowerCase()==$form["equipo"].value.toLowerCase())
        if (equipo) {
            addCamiseta(equipo.id)
        } else {
            let resp=await ajax({
                url:urlTeams,
                method:"POST",
                data: {
                    name:capitalize($form[equipo].value)
                }    
            })
            if (!resp.error) {
                teams.push(resp.info)
                renderTeams(teams)
                addCamiseta(resp.info.id)
            }
        }
    }
})

$cancelar.addEventListener("click", ev=>{
    $confirmar.textContent="Añadir"
    $form.reset()
})

$d.addEventListener("DOMContentLoaded",ev=>{
    getData()

    new GridCombobox(
        $d.getElementById('equipo'),
        $equipos,
        searchEquipos
    );  
})