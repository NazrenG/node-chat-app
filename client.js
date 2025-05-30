import readline from "readline";
import { io } from "socket.io-client";
import { encrypt, decrypt } from "./encryption.js";

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let username;
let password;
let mode = null;
let target = null;

socket.on("receive_private_message", ({ from, message }) => {
  const decrypted = decrypt(message);
  console.log(`\n[PRIVATE] ${from}: ${decrypted}`);
  promptInput();
});

socket.on("receive_room_message", ({ from, message }) => {
  const decrypted = decrypt(message);
  console.log(`\n[ROOM] ${from}: ${decrypted}`);
 // promptInput();
});
socket.on("register_success", (msg) => {
  console.log(msg);
  chooseMode();
});

socket.on("login_success", (msg) => {
  console.log(msg);
  chooseMode();
});

socket.on("login_error", (msg) => {
  console.log(msg);
  rl.close();
});

rl.question("Enter your username: ", (name) => {
  username = name;
  rl.question("Enter your password: ", (pass) => {
    password = pass;
    socket.emit("register", { username, password });
    socket.on("register_success", (msg) => {
      console.log(msg.username);
      chooseMode();
    });
    //chooseMode();
  });
});

function chooseMode() {
  rl.question(
    "\nChoose chat mode:\n1) Private chat\n2) Room chat\n> ",
    (choice) => {
      if (choice === "1") {
        mode = "private";
        rl.question("Enter username to chat with: ", (user) => {
          target = user;
          promptInput();
        });
      } else if (choice === "2") {
        mode = "room";
        rl.question("Enter room name: ", (room) => {
          target = room;
          socket.emit("join_room", room);
          promptInput();
        });
      } else {
        console.log("Invalid choice.");
        chooseMode();
      }
    }
  );
}

function promptInput() {
  rl.question(
    `${mode === "private" ? `[${target}]` : `[${target} Room]`} > `,
    (msg) => {
      if (msg.trim().toLowerCase() === "/menu") {
        mode = null;
        target = null;
        chooseMode();
        return;
      }

      if (mode === "private") {
        socket.emit("send_private_message", {
          to: target,
          message: encrypt(msg),
        });
      } else if (mode === "room") {
        socket.emit("send_room_message", {
          room: target,
          message: encrypt(msg),
        });
      }

      promptInput();
    }
  );
}
