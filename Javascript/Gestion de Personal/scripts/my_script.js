const capitalize = (cadena) =>cadena.toLowerCase().split(" ").map((el) => el.trim()).filter((el) => el != "").map((el) => el[0].toUpperCase() + el.slice(1)).join(" ");
const ascSort = (vect, campo) =>vect.sort((u1, u2) => u1[campo].localeCompare(u2[campo]));
const descSort = (vect, campo) => ascSort(vect, campo).reverse();

const $d=document,
      $tbody=$d.querySelector("tbody"),
      $form=$d.querySelector("form"),
      $btnAdd=$d.querySelector(".btn--add"),
      $searchField=$d.querySelector("#searchField"),
      $search=$d.querySelector("#search"),
      $order=$d.querySelector("#order"),
      $thead=$d.querySelector("thead"),
      $tfoot=$d.querySelector("tfoot")

const fields=["nombre","apellidos","nif","email"]

const urlUsuarios="http://localhost:3000/usuarios",
      usuarios=[]

let nif=/^\d{8}-[A-Z]$/
let email=/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i


async function ajax(options){
   const {url,method,data}=options

   try {
      let resp=await fetch(url,{
         method:method || "GET",
         headers:{"Content-type":"Application/json; charsert=utf-8"},
         body:JSON.stringify(data)
      })

      if(!resp.ok){
         let statusText=resp.statusText || "Ocurrió un error"
         throw new Error(`${resp.status} ${statusText}`)
      }

      let json=await resp.json()
      return {
         error:false,
         info:json
      }
   } catch (msgError) {
      return{
         error:true,
         info:msgError
      }
   }
}

async function getData(){
      let resp=await fetch(urlUsuarios)
      .then(resp=>resp.ok?resp.json():Promise.reject(resp))
      .then(json=>{
         usuarios.splice(0,usuarios.length,...json)
         //console.log(usuarios)
         renderUsuarios(usuarios)
      })
      .catch(error=>{
         console.log(error)
      })
}  

function renderUsuarios(usuarios){
      $tbody.innerHTML=usuarios.map(el=>`
            <tr>
               <td scope="col">
               <i class="fas fa-undo-alt" data-id="${el.id}"></i>
               <i class="fa fa-trash" aria-hidden="true" data-id="${el.id}"></i>
               </td>
               <td scope="col" width="10%">${el.nombre}</td>
               <td scope="col">${el.apellidos}</td>
               <td scope="col">${el.nif}</td>
               <td scope="col">${el.email}</td>
            </tr>`).join('')
      if(usuarios.length){
         $tfoot.innerHTML=`<tr>
                              <td colspan="4">Total de Registros: </td>
                              <td>${usuarios.length}</td>
                           </tr>`
      }else{
         $tfoot.innerHTML=`<tr><td colspan="5">No hay personal (con esos criterios)"</td></tr>`
      }
}

$searchField.addEventListener("change",ev=>{
   let cad=$search.value
   if (cad) {
      const filteredUsers=usuarios.filter(u=>u[$searchField.value].toLowerCase().includes(cad.toLowerCase()))
      renderUsuarios(filteredUsers)
   }
})

$search.addEventListener("keyup",ev=>{
   let cad=$search.value
   let filteredUsers=[...usuarios]
   if (cad!="") {
      filteredUsers=usuarios.filter(u=>u[$searchField.value].toLowerCase().includes(cad.toLowerCase()))
   }
   renderUsuarios(filteredUsers)
})

function checkform(){
   let campos=["nombre","apellidos","nif","email"]
   let cubiertos=campos.every(campo=>$form[campo]!="")
   let dni=nif.test($form["nif"].value)
   let correo=email.test($form["email"].value)
   let nuevoNif=$form["nif"].value

   if(!dni){
      alert("El formato del NIF es incorrecto")
   }else{
      let duplicado=usuarios.findIndex(usuario=>usuario.nif==nuevoNif)
      if(duplicado!=-1){
         alert("El NIF ya está registrado")
      }else{
         if(!cubiertos){
            alert("Debe cubrir todos los campos")
         }else{
            return true
         }
      }
   }
   return false
}


async function addUsuario(){
   if(checkform()){
      let usuario = {}
      fields.forEach(field=>usuario[field]=$form[field].value)
      console.log((usuario));
      
      let json =await ajax({url:urlUsuarios,method:"POST",data:usuario})
   
      if(!json.error){
         usuarios.push(json.info)
         $btnAdd.classList.remove("off")
         $btnAdd.textContent="Añadir Usuario"
         $tbody.addEventListener("click",handleClick)
         $form.reset()
         renderUsuarios(usuarios)
      }else{
         alert(json.info)
      }
   }else{
      alert("Debe cubrir todos los campos, en un formato válido")
   }
}

async function updateUsuario(id) {
   $form["nif"].disabled=false
   $searchField.disabled=false
   $search.disabled=false

   if(checkform()){
      let usuario={}

      fields.forEach(field=>usuario[field]=$form[field].value)
   
      let json=await ajax({url:`${urlUsuarios}/${id}`,method:"PATCH",data:usuario})
   
      if(!json.error){
         let indice=usuarios.findIndex(el=>el.id==id)
         usuarios.splice(indice,1,json.info)
         $btnAdd.textContent="Añadir Usuario"
         $form.reset()
         
         delete $btnAdd.dataset.id
         $tbody.addEventListener("click", handleClick)
         renderUsuarios(usuarios)
      }
   }else{
      alert("Debe cubrir todos los datos")
   }
}

// $btnAdd.addEventListener("submit", ev=>{
//    console.log("dispara evento");
//    ev.preventDefault()
   
//    let id=ev.target.dataset.id
//    if(id){
//       console.log("modificar");
//       updateUsuario(id)
//    }else{
//       console.log("añadir");
//       addUsuario()
//    }
// })

$btnAdd.addEventListener("click",ev=>{
    ev.preventDefault()
   
   let id=ev.target.dataset.id
   if(id){
      console.log("modificar");
      updateUsuario(id)
   }else{
      console.log("añadir");
      addUsuario()
   }
})

async function delUsuario(id){
   let json=await ajax({url:`${urlUsuarios}/${id}`,method:"DELETE"})

   if(!json.error){
      usuarios.splice(usuarios.findIndex(el=>el.id==id),1)
      renderUsuarios(usuarios)
   }else{
      alert(json.info)
   }
}

function fillFormUsusuario(id){
   let usuario=usuarios.find(el=>el.id==id)
   fields.forEach(field=>$form[field].value=usuario[field])
   $form["nif"].disabled=true
   $searchField.disabled=true
   $search.disabled=true
   $btnAdd.textContent="Actualizar"
   $btnAdd.dataset.id=id
   $tbody.querySelectorAll("i").forEach(el=>el.classList.add("off"))
   $tbody.removeEventListener("click",handleClick)
}

/**También podemos evaluar si el evento no tiene la clase off, hace esto, si no no, y así
 * evitamos el tener que quitar el evento
 */
function handleClick(ev){
   if(ev.target.dataset.id){
      //console.log(ev.target.dataset.id);
      let id=ev.target.dataset.id 
      if(ev.target.classList.contains("fa-trash")){
         //console.log("Eliminar")
         delUsuario(id)
      }else{
         //console.log("Modificar")
         fillFormUsusuario(id)
      }
   }
}

$thead.addEventListener("click", ev=>{
   let filteredUsers = [...usuarios];
   if(ev.target.tagName=="TH"){
      if (ev.target.textContent!="Acciones") {
         let seleccionado=$thead.querySelector(".cabecera--ordenado")
         seleccionado.textContent=seleccionado.querySelector("span").textContent
         seleccionado.classList.toggle("cabecera--ordenado")
         ev.target.innerHTML=`
               <span>${ev.target.textContent}</span>
               <span class="ordenar">
                <img src="./img/dsc.svg" id="order" class="ordenar__icon" alt="">
              </span>
         `
         ev.target.classList.toggle("cabecera--ordenado")
      }            
   }
   if(ev.target.tagName==("IMG")){
         //cambiar imagen flecha
         if(ev.target.src.includes("dsc.svg")){
            ev.target.src="../img/asc.svg";
            //filtrar ascencente
         }else{
            ev.target.src="../img/dsc.svg";
            //filtrar descendente
         }
         //Renderizar usuarios filtrados
      }
      //renderizo en funcion de la flecha que tenga
})

$tbody.addEventListener("click", handleClick)

$d.addEventListener("DOMContentLoaded",getData())