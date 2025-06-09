const $d=document
        $list=$d.querySelector(".list"),
        $balance=$d.querySelector("#balance"),
        $moneyPlus=$d.querySelector("#money-plus"),
        $moneyMinus=$d.querySelector("#money-minus"),
        $form=$d.querySelector("form"),
        $btnAdd=$d.querySelector("#btn-add"),
        $concepto=$d.querySelector("#text"),
        $cantidad=$d.querySelector("#amount")

const urlMovimientos="http://localhost:3000/movimientos",
        movimientos=[]

async function ajax(options){
    const {url,method,data}=options

    try {
        let resps=await fetch(url,{
            method:method || "GET",
            headers:{"Content-type":"application/json; charset:utf-8"},
            body:JSON.stringify(data)
        })

        if(!resps.ok){
            const statusText=resps.statusText || "Ocurrió un error"
            throw new Error(`${resps.status} ${statusText}`)
        } 

        let json=await resps.json()
        return {
            error:false,
            info:json
        }
    } catch (msjError) {
        return {
            error:true,
            info:msjError
        }
    }
}

async function getData(){
    let resp=await fetch(urlMovimientos)
    .then(resp=>resp.ok?resp.json():Promise.reject(resp))
    .then(json=>{
        movimientos.splice(0,movimientos.length,...json)
        //console.log(movimientos)
        renderMovimientos(movimientos)
    })
    .catch(error=>{
        console.log(error)
    })
}

function checkForm(){
    if($concepto.value!="" && $cantidad.value!=""){
        return true
    }else{
        return false        	
    }
}

function renderMovimientos(movimientos){
    $list.innerHTML=movimientos.map(el=>`
        <li class="${el.cantidad>0?"plus":"minus"}">${el.concepto}
        <span class="${el.estado?'':'tachar'}">${el.cantidad}</span>
        <p class="list-btn">
          <i class="fa-solid fa-trash delete-btn" data-id="${el.id}"></i>
          <i class="fa-solid fa-eye hiden-btn" data-id="${el.id}"></i>
          <i class="fas fa-undo-alt modify-btn" data-id="${el.id}"></i>
        </p>
      </li>`).join('')

    let entradas=movimientos.filter(el=>el.estado)
                            .filter(el=>el.cantidad>0)
                            .reduce((anterior,actual)=>anterior + parseFloat(actual.cantidad),0)
    $moneyPlus.innerHTML=`${entradas} &euro;`

    let salidas=movimientos.filter(el=>el.estado)
                            .filter(el=>parseFloat(el.cantidad)<0)
                            .reduce((anterior,actual)=>anterior + parseFloat(actual.cantidad),0)
        
    $moneyMinus.innerHTML=`${salidas} &euro;`
    $balance.innerHTML=`&euro; ${entradas + salidas}`
    }

async function addMovimiento(movimientos){

    let movimiento={
        concepto:$concepto.value,
        cantidad:$cantidad.value,
        estado:"true"
    }

    let json=await ajax({url:urlMovimientos,method:"POST",data:movimiento})
    if(!json.error){
        movimientos.push(json.info)
        $form.reset()
        renderMovimientos(movimientos)
    }else{
        alert(json.info)
    }
}

async function delMovimiento(movimientos,id){
    let json=await ajax({url:`${urlMovimientos}/${id}`,method:"DELETE"})

    if(!json.error){
        movimientos.splice(movimientos.findIndex(el=>el.id==id),1)
        renderMovimientos(movimientos)
    }else{
        alert(json.info)
    }
}

function hidenMovimiento(movimientos,id) {
    let movimiento=movimientos.find(el=>el.id==id)
    movimiento.estado=!movimiento.estado
    renderMovimientos(movimientos)
}

async function modifyMovimiento(id){
    let movimiento=await ajax({url:`${urlMovimientos}/${id}`})

   $concepto.value=movimiento.info["concepto"]
   $cantidad.value=movimiento.info["cantidad"]
   $btnAdd.textContent="Actualizar transacción"
   $btnAdd.dataset.id=movimiento.info.id
   $list.querySelectorAll("i").forEach(el=>el.classList.add("off"))
   $list.removeEventListener("click",handleClick)
}

$form.addEventListener("submit", async ev=>{
    ev.preventDefault()
    
    if($btnAdd.dataset.id){
        //console.log("modificar")
        if(checkForm()){
            let movimiento=movimientos.find(el=>el.id==$btnAdd.dataset.id)
            movimiento.concepto=$concepto.value
            movimiento.cantidad=$cantidad.value

            let json=await ajax({url:`${urlMovimientos}/${movimiento.id}`,method:"PATCH", data:movimiento})
            
            if(!json.error){
                $form.reset()
                $btnAdd.textContent="Añadir Transacción"
                delete $btnAdd.dataset.id
                $list.querySelectorAll("i").forEach(el=>el.classList.remove("off"))
                $list.addEventListener("click", handleClick)
                movimientos.splice(movimientos.findIndex(el=>el.id==$btnAdd.dataset.id),1,json.info)
                renderMovimientos(movimientos)
            }else{
                alert(json.info)
            } 
        }
        
    }else{
        if(checkForm()){
            //console.log("añadimos")
            addMovimiento(movimientos)
        }else{
            alert("Añada concepto y cantidad")
        }
    }
})

function handleClick(ev){
    let id=ev.target.dataset.id
    
    if(ev.target.classList.contains("delete-btn")){
        //console.log("Borrar")      
        delMovimiento(movimientos,id)
    }
    if(ev.target.classList.contains("hiden-btn")){
        //console.log("Ocultar")
        hidenMovimiento(movimientos,id)        
    }
    if(ev.target.classList.contains("modify-btn")){
        //console.log("Modificar")   
        modifyMovimiento(id)     
    }
}

$list.addEventListener("click", handleClick)

$d.addEventListener("DOMContentLoaded", getData())
