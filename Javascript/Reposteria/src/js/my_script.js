const $d=document,
$cards=$d.querySelector(".cards"),
$carrito=$d.querySelector(".carrito"),
$carritoModal=$d.querySelector(".carrito__productos")

const urlPostres="http://localhost:3000/postres",
        urlCestas="http://localhost:3000/cestas",
        postres=[],
        cesta=[]


async function ajax(options){
    const {url,method,data}=options

    try {
        let resp=await fetch(url,{
            method:method || "GET", 
            headers:{"Content-type":"application/json; charset=utf-8"},
            body:JSON.stringify(data)
        })

        if(!resp.ok){
            let statusText=resp.statusText || "Ocurrio un error"
            throw new Error(`${resp.error} ${statusText}`)
        }

        let json=await resp.json()

        return {
            error:false,
            info:json
        }
    } catch (msgError) {
        return {
            error:true,
            info:msgError
        }
    }
}

function getData(){
    Promise.all([fetch(urlPostres), fetch(urlCestas)])
    .then(resps=>Promise.all(resps.map(resp=>resp.ok?resp.json():Promise.reject(resp))))
    .then(jsons=>{
        postres.splice(0,postres.length,...jsons[0])
        cesta.splice(0,cesta.length,...jsons[1])
        renderPostres(postres)
        renderCesta(cesta)
    })
    .catch(errors=>{
        console.log(errors)
    })
}

function renderPostres(postres){
    
    $cards.innerHTML=postres.map(el=>{
      let postre=cesta.find(p=>p.postreId==el.id)
      
        return `<li class="card">
        <figure class="card__img">
          <!-- Imagen desktop del postre, por ejemplo -->
          <img src="${el.image["desktop"]}" alt="" />
        </figure>

        ${postre
            ?`<p class="card__add card__add--count">
          <button class="card__btn" data-id="${el.id}">-</button>
          <span class="num">${postre.cantidad}</span>
          <button class="card__btn" data-id="${el.id}">+</button>
        </p>`
            :`<p class="card__add" data-id="${el.id}">Añadir al carro</p>`
        }        

        <section class="card__content">
          <p class="categoria">${el.category}</p>
          <h4 class="card__titulo">${el.name}</h4>
          <p class="precio">${el.price}</p>
        </section>
      </li>`
    }).join('')
}

function renderCesta(cesta){
  let postreHTML = ""
  let pvp = 0, precioTotal
  let unidades = cesta.reduce((anterior,actual)=>anterior+actual.cantidad,0)
  let total = cesta.reduce((anterior,actual)=>{
      let producto=postres.find((producto)=>producto.id==actual.postreId)
      return anterior+actual.cantidad*producto.price
  },0)

  if(cesta.length){
    $carrito.classList.remove("carrito--vacio")
    postreHTML=cesta.map(p=>{
      
      let postre=postres.find((post)=>post.id==p.postreId)
      
      pvp=p.cantidad*postre.price
      
      return `<li class="producto">
                <p class="producto__nombre">
                ${postre.name}
                <button class="btn--delete" data-id="${p.id}">X</button>
                </p>
                <p class="producto__info">
                <span class="cantidad">${p.cantidad}x</span>
                <span class="precio">${postre.price}</span>
                <span class="precio precio--total">${pvp}</span>
                </p>
            </li>`
    }).join('')

    $carrito.innerHTML=`<h3>Su cesta<span class="carrito__unidades">(${unidades})</span></h3>
                        <a href="" class="carrito__delete">
                            <img src="./assets/images/icon-delete-to-cart.svg" alt="" />
                        </a>
                        <ul class="carrito__productos">
                            <!-- Lista de postres en el carrito: template-cesta-postre-item -->
                            ${postreHTML}
                        </ul>
                        <p class="carrito__total">
                            Compra total<span class="precio">${total}</span>
                        </p>
                        <button class="btn carrito__btn" onclick="window.confirmar.showModal();">
                            Confirmar compra
                        </button>`
  
    let $cestaDelete=$d.querySelector(".carrito__delete")
    $cestaDelete.addEventListener("click",ev=>{
      ev.preventDefault()
      vaciarCesta(cesta)
    })

    let $confirmar=$d.querySelector(".carrito__btn")
    $confirmar.addEventListener("click",ev=>{
      ev.preventDefault()
      renderDialog(cesta)
    })

  }else{
     $carrito.classList.add("carrito--vacio")
        $carrito.innerHTML = `
        <h3>Su cesta <span class="carrito__total"></span></h3>
        <p class="aviso">Sus artículos añadidos aparecerán aquí</p>`
  }
}

function renderDialog(cesta){
  if(cesta.length){
    $carritoModal.innerHTML=cesta.map(el=>{
      let postre=postres.find(p=>p.id==el.postreId)
      let pvp=el.cantidad*postre.price
     
      return `<li class="producto">
        <figure>
          <!-- Imagen thumbnail del postre, por ejemplo -->
          <img src="${postre.image.thumbnail}" alt="${postre.name}" />
        </figure>
        <div role="region">
          <p class="producto__nombre">
            <!-- Nombre del postre -->
            ${postre.name}
            <button class="btn--delete" data-id="${el.id}">X</button>
          </p>
          <p class="producto__info">
            <span class="cantidad">${el.cantidad}x</span>
            <span class="precio">${postre.price}</span>
            <span class="precio precio--total">${pvp}</span>
          </p>
          
        </div>
      </li>`
    }).join('')
    
  }else{
    $carritoModal.innerHTML=`
    <h3>Su cesta <span class="carrito__total"></span></h3>
      <p class="aviso">Sus artículos añadidos aparecerán aquí</p>`

  }

}

function vaciarCesta(cesta){
  Promise.all(cesta.map(el=>fetch(`${urlCestas}/${el.id}`,{method:"DELETE"})))
  .then(resps=>Promise.all(resps.map(resp=>resp.ok?resp.json():Promise.reject(resp))))
  .then(jsons=>{
    cesta.splice(0,cesta.length)
    renderPostres(postres)
    renderCesta(cesta)
  })
  .catch(error=>
        alert(`Error al vaciar la cesta: ${error}`)
    )
}

async function deletePostre(postreId){
  let json=await ajax({url:`${urlCestas}/${postreId}`,method:"Delete"})
  
  if(!json.error){    
    cesta.splice(cesta.findIndex(el=>el.id==postreId),1)    
    renderCesta(cesta)
    renderPostres(postres)
    renderDialog(cesta)
  }else{
    alert(json.info)
  }
}

async function addPostre(postreId){
  
  let json = await ajax({url:urlCestas,method:"POST",data:{
    cantidad:1,
    postreId
  }})

  if(!json.error){
    cesta.push(json.info)
    renderCesta(cesta)
    renderPostres(postres)
  }else{
    alert(json.info)
  }
  
}

async function updatePostre(postreId,cantidad){

  if(cantidad==0){
    deletePostre(postreId)
  }else{
    let json=await ajax({url:`${urlCestas}/${postreId}`,method:"PATCH",data:{
      cantidad
    }})

    if(!json.error){
      cesta.splice(cesta.findIndex(el=>el.id==postreId),1,json.info)
      renderPostres(postres)
      renderCesta(cesta)
    }else{
      alert(json.info)
    }
  }
}

$cards.addEventListener("click", ev=>{
  ev.preventDefault()
  let id=ev.target.dataset.id
  if(id){
    let postre=cesta.find(el=>el.postreId==id)
    if(ev.target.textContent==("+")){ 
      updatePostre(postre.id, postre.cantidad + 1)
    }else if(ev.target.textContent==("-")){
      updatePostre(postre.id,postre.cantidad -1)
    }else if(ev.target.dataset.id){
      addPostre(id)
    }
  }
})

$carrito.addEventListener("click",ev=>{
  if(ev.target.dataset.id){
    deletePostre(ev.target.dataset.id)
  }
})

$carritoModal.addEventListener("click",ev=>{
  id=ev.target.dataset.id
  if(id){
    deletePostre(id)
  }
})

$d.addEventListener("DOMContentLoaded", getData())
