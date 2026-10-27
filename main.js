let productos = [];
let carrito = {};
let precioMayor = 0;

let categorias = {
  "groceries": "Almacén",
  "beauty": "Belleza",
  "skin-care": "Cuidado personal",
  "home-decoration": "Hogar",
  "kitchen-accessories": "Cocina"
};

let busqueda = document.getElementById("busqueda");
let categoria = document.getElementById("categoria");
let precio = document.getElementById("precio");
let orden = document.getElementById("orden");

function formatoPrecio(numero) {
  return "$" + numero.toFixed(2).replace(".", ",");
}

function cargarProductos() {
  document.getElementById("resultados").textContent = "Cargando productos...";
  document.getElementById("reintentar").hidden = true;
  fetch("https://dummyjson.com/products?limit=0").then(leerRespuesta).then(recibirProductos).catch(errorCarga);
}

function leerRespuesta(respuesta) {
  if (respuesta.ok === false) {
    throw new Error("No se pudieron cargar los productos.");
  }
  return respuesta.json();
}

function recibirProductos(datos) {
  recuperarCarrito();
  productos = [];
  precioMayor = 0;
  for (let i = 0; i < datos.products.length; i++) {
    let producto = datos.products[i];
    if (categorias[producto.category] !== undefined) {
      productos.push(producto);
      if (Number.isInteger(carrito[producto.id]) === false || carrito[producto.id] < 0) {
        carrito[producto.id] = 0;
      }
      if (producto.price > precioMayor) {
        precioMayor = producto.price;
      }
    }
  }
  precioMayor = Math.ceil(precioMayor);
  precio.max = precioMayor;
  precio.value = precioMayor;
  document.getElementById("controles").disabled = false;
  mostrarProductos();
  mostrarCarrito();
}

function errorCarga() {
  document.getElementById("resultados").textContent = "No se pudieron cargar los productos.";
  document.getElementById("reintentar").hidden = false;
}

function comparar(a, b) {
  if (orden.value === "menor") {
    return a.price - b.price;
  }
  if (orden.value === "mayor") {
    return b.price - a.price;
  }
  return a.title.localeCompare(b.title);
}

function mostrarProductos() {
  let texto = busqueda.value.toLowerCase().trim();
  let maximo = Number(precio.value);
  let encontrados = [];
  let lista = document.getElementById("productos");
  document.getElementById("valor-precio").textContent = maximo;
  lista.innerHTML = "";
  for (let i = 0; i < productos.length; i++) {
    let producto = productos[i];
    let coincideNombre = producto.title.toLowerCase().includes(texto);
    let coincideCategoria = categoria.value === "todas" || producto.category === categoria.value;
    let coincidePrecio = producto.price <= maximo;
    if (coincideNombre && coincideCategoria && coincidePrecio) {
      encontrados.push(producto);
    }
  }
  if (orden.value !== "original") {
    encontrados.sort(comparar);
  }
  document.getElementById("resultados").textContent = "Productos encontrados: " + encontrados.length;
  for (let i = 0; i < encontrados.length; i++) {
    let producto = encontrados[i];
    let tarjeta = document.createElement("article");
    tarjeta.className = "producto";
    tarjeta.innerHTML =
      "<img alt=''>" +
      "<h3></h3>" +
      "<p class='categoria-producto'></p>" +
      "<p class='precio-producto'></p>" +
      "<button type='button'>Agregar al carrito</button>";
    tarjeta.querySelector("img").src = producto.thumbnail;
    tarjeta.querySelector("img").alt = producto.title;
    tarjeta.querySelector("h3").textContent = producto.title;
    tarjeta.querySelector(".categoria-producto").textContent = categorias[producto.category];
    tarjeta.querySelector(".precio-producto").textContent = formatoPrecio(producto.price);
    tarjeta.querySelector("button").onclick = function () {
      agregar(producto.id);
    };
    lista.appendChild(tarjeta);
  }
}

function limpiarFiltros() {
  busqueda.value = "";
  categoria.value = "todas";
  precio.value = precioMayor;
  orden.value = "original";
  mostrarProductos();
}

function agregar(id) {
  carrito[id]++;
  actualizarCarrito();
}

function restar(id) {
  if (carrito[id] > 0) {
    carrito[id]--;
  }
  actualizarCarrito();
}

function quitar(id) {
  carrito[id] = 0;
  actualizarCarrito();
}

function vaciarCarrito() {
  for (let i = 0; i < productos.length; i++) {
    carrito[productos[i].id] = 0;
  }
  actualizarCarrito();
}

function mostrarCarrito() {
  let lista = document.getElementById("lista-carrito");
  let total = 0;
  let unidades = 0;
  lista.innerHTML = "";
  for (let i = 0; i < productos.length; i++) {
    let producto = productos[i];
    let cantidad = carrito[producto.id];
    if (cantidad > 0) {
      let subtotal = Math.round(producto.price * 100) * cantidad;
      total = total + subtotal;
      unidades = unidades + cantidad;
      let fila = document.createElement("div");
      fila.className = "item-carrito";
      fila.innerHTML =
        "<h3></h3>" +
        "<p class='precio-unitario'></p>" +
        "<div class='cantidad'>" +
        "<button class='restar' aria-label='Restar una unidad'>−</button>" +
        "<span></span>" +
        "<button class='sumar' aria-label='Sumar una unidad'>+</button>" +
        "</div>" +
        "<p class='subtotal'></p>" +
        "<button class='quitar'>Quitar</button>";
      fila.querySelector("h3").textContent = producto.title;
      fila.querySelector(".precio-unitario").textContent = formatoPrecio(producto.price) + " por unidad";
      fila.querySelector("span").textContent = cantidad;
      fila.querySelector(".subtotal").textContent = "Subtotal: " + formatoPrecio(subtotal / 100);
      fila.querySelector(".restar").onclick = function () {
        restar(producto.id);
      };
      fila.querySelector(".sumar").onclick = function () {
        agregar(producto.id);
      };
      fila.querySelector(".quitar").onclick = function () {
        quitar(producto.id);
      };
      lista.appendChild(fila);
    }
  }

  if (unidades === 0) {
    lista.textContent = "El carrito está vacío.";
  }
  document.getElementById("total").textContent = formatoPrecio(total / 100);
  document.getElementById("vaciar").disabled = unidades === 0;
}

function actualizarCarrito() {
  mostrarCarrito();
  try {
    localStorage.setItem("mini-market-cantidades", JSON.stringify(carrito));
    document.getElementById("error-guardado").hidden = true;
  } catch (error) {
    document.getElementById("error-guardado").hidden = false;
  }
}

function recuperarCarrito() {
  carrito = {};
  try {
    let guardado = JSON.parse(localStorage.getItem("mini-market-cantidades"));
    if (guardado !== null && typeof guardado === "object") {
      carrito = guardado;
    }
  } catch (error) {
    carrito = {};
  }
}

busqueda.oninput = mostrarProductos;
categoria.onchange = mostrarProductos;
precio.oninput = mostrarProductos;
orden.onchange = mostrarProductos;

document.getElementById("limpiar").onclick = limpiarFiltros;
document.getElementById("reintentar").onclick = cargarProductos;
document.getElementById("vaciar").onclick = vaciarCarrito;

cargarProductos();