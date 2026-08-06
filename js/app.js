function login(){

    let usuario = document.getElementById("usuario").value;

    let senha = document.getElementById("senha").value;

    if(usuario=="admin" && senha=="1234"){

        window.location.href = "dashboard.html";

    

    }

    else{

        document.getElementById("mensagem").innerHTML="Usuário ou senha incorretos.";

    }

}
console.log("Supabase conectado!");
console.log(supabase);