let db;
const request = indexedDB.open('budgetTracker', 1)

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('budgetTracker', { autoIncrement: true});
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.online) {
       uploadTransaction()
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode)
};

function saveRecord(record) {
    const action = db.transaction(['budgetTracker'], 'readwrite');

    const budgetTrackerObjectStore = action.objectStore('budgetTracker');

    budgetTrackerObjectStore.add(record)
    console.log('1', budgetTrackerObjectStore)
}

function uploadTransaction() {
    // open a transaction on your pending db
    const action = db.transaction(['budgetTracker'], 'readwrite');
  
    // access your pending object store
    const budgetTrackerObjectStore = action.objectStore('budgetTracker');
  
    // get all records from store and set to a variable
    const getAll = budgetTrackerObjectStore.getAll();
  
    getAll.onsuccess = function() {
      // if there was data in indexedDb's store, let's send it to the api server
      if (getAll.result.length > 0) {
        fetch('/api/transaction', {
          method: 'POST',
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        })
          .then(response => response.json())
          .then(serverResponse => {
            if (serverResponse.message) {
              throw new Error(serverResponse);
            }
  
            const transaction = db.transaction(['new_transaction'], 'readwrite');
            const budgetTrackerObjectStore = transaction.objectStore('new_transaction');
            // clear all items in your store
            budgetTrackerObjectStore.clear();
          })
          .catch(err => {
            // set reference to redirect back here
            console.log(err);
          });
      }
    };
  }
  
  // listen for app coming back online
  window.addEventListener('online', uploadTransaction);
  