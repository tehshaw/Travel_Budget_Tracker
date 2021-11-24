let db;

const request = window.indexedDB.open("TravelDB", 1);


request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("TravelWallet", {autoIncrement : true});

};

//if able to open the client indexedBD then set the DB to the var
request.onsuccess = function (event) {
  db = event.target.result;

  //check if the browser is online
  //if it is check if there is anydata stored in the client
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.error("Error", request.error);
};

//save a record to the client DB
//This is called when the API request returns an error, most likely due to being offline but will catch other failures
function saveRecord(record) {
  const { name, value, date } = record
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["TravelWallet"], "readwrite");
  // access the pending object store
  const TravelWallet = transaction.objectStore("TravelWallet");
  // add pending record to the store with add method.
  TravelWallet.add({name, value, date})
}

//will check to see if there are any stored transactions in the client
//if there are save them to the server
function checkDatabase() {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["TravelWallet"], "readwrite");
  // access the pending object store
  const TravelWallet = transaction.objectStore("TravelWallet");
  // get all records from the store and save to a variable
  const storeIDs = TravelWallet.getAll();

  storeIDs.onsuccess = function () {
    //if there are any records in the store, call the API to store them in the server-side DB
    if (storeIDs.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(storeIDs.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if the save is successful, open a transaction to the pending db
          const transaction = db.transaction(["TravelWallet"], "readwrite");
          // access the pending object store
          const TravelWallet = transaction.objectStore("TravelWallet");
          // clear the client store since all items have been saved on the server
          TravelWallet.clear()
        });
    }
  };
}

// Listen to the client to see if it is online
//then call function to see if there is any data stored locally
window.addEventListener('online', checkDatabase);
