web3.eth.getTransactionReceiptMined = function (txnHash) {
    var transactionReceiptAsync;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            var receipt = web3.eth.getTransactionReceipt(txnHash);
            if (receipt == null) {
                setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject);
                }, 500);
            } else {
                resolve(receipt);
            }
        } catch(e) {
            reject(e);
        }
    };

    return new Promise(function (resolve, reject) {
        transactionReceiptAsync(txnHash, resolve, reject);
    });
};

var generator = require("ether-pudding/generator");

contract('ProductPayment, regular operations,', function(accounts) {

  var owner = accounts[0];
  var contributor = accounts[1];
  var beneficiary = "0x0000000000000000000000000000000000000001";
  var productPayment;

  it("should deploy a new productPayment, with owner as beneficiary", function (done) {

    ProductPayment.new(
        web3.toWei(100, "finney"),
        owner,
        { from: owner })
      .then(function (newProductPayment) {
        productPayment = newProductPayment;
      })
      .then(done)
      .catch(done);

  });

  it("should be possible to change beneficiary", function (done) {

    productPayment.setBeneficiary.call(beneficiary)
        .then(function (success0) {
            assert.isTrue(success0, "setBeneficiary cannot be called");
            return productPayment.setBeneficiary(
                beneficiary,
                { from: owner });
        })
        .then(function (txn1) {
            return web3.eth.getTransactionReceiptMined(txn1);
        })
        .then(function (receipt2) {
            return productPayment.beneficiary();    
        })
        .then(function (beneficiaryAddress3) {
            assert.equal(beneficiaryAddress3, beneficiary, "beneficiary was not changed");
        })
        .then(done)
        .catch(done);

  });

  it("should not be possible to send value of zero", function (done) {

    new Promise(function (resolve, reject) {
            try {
                resolve(web3.eth.sendTransaction({
                        from: owner, 
                        to: productPayment.address,
                        value: 0,
                        gas: 3000000
                    }));
            } catch (e) {
                reject(e);
            }
        })
        .then(function (txn0) {
            return web3.eth.getTransactionReceiptMined(txn0);
        })
        .then(function (receipt1) {
            assert.equal(receipt1.gasUsed, 3000000, "There should have been an exception in sending the transaction");
        })
        .then(done)
        .catch(function(e) {
            if ((e + "").indexOf("invalid JUMP") > -1) {
                // We are in TestRPC
                done();
            } else {
                done(e);
            }
        });

  });

  it("should be possible to send some value twice, and see it saved", function (done) {

    txn0 = web3.eth.sendTransaction({
            from: owner, 
            to: productPayment.address,
            value: 345,
            gas: 2000000
        });

    web3.eth.getTransactionReceiptMined(txn0)
        .then(function (receipt0) {
            assert.isAtMost(receipt0.gasUsed, 200000, "Not all gas should have been consumed");
            return productPayment.contributors(0);
        })
        .then(function (contributorAddress1) {
            assert.equal(contributorAddress1, owner, "contributor was not saved?");
            return productPayment.contributions(contributorAddress1);
        })
        .then(function (contribution2) {
            assert.equal(contribution2.valueOf(), 345, "contribution not kept");
            return productPayment.isPaid();
        })
        .then(function (isPaid3) {
            assert.isFalse(isPaid3);
            return web3.eth.getTransactionReceiptMined(web3.eth.sendTransaction({
                from: owner, 
                to: productPayment.address,
                value: 111,
                gas: 1000000
            }));
        })
        .then(function (receipt4) {
            assert.isAtMost(receipt4.gasUsed, 200000, "Not all gas should have been consumed");
            return productPayment.contributors(0);
        })
        .then(function (contributorAddress5) {
            assert.equal(contributorAddress5, owner, "contributor was not saved?");
            return productPayment.getContributorsCount();
        })
        .then(function (contributorCount6) {
            assert.equal(contributorCount6, 1, "contributor should not have been saved again");
            return productPayment.contributions(owner);
        })
        .then(function (contribution7) {
            assert.equal(contribution7.valueOf(), 456, "contribution not kept");
            return productPayment.isPaid();
        })
        .then(function (isPaid8) {
            assert.isFalse(isPaid8);
        })
        .then(done)
        .catch(done);

  });

  it("should be possible to send, from another account, some value twice, and see it saved", function (done) {

    txn0 = web3.eth.sendTransaction({
            from: contributor, 
            to: productPayment.address,
            value: 543,
            gas: 2000000
        });

    web3.eth.getTransactionReceiptMined(txn0)
        .then(function (receipt0) {
            assert.isAtMost(receipt0.gasUsed, 200000, "Not all gas should have been consumed");
            return productPayment.contributors(1);
        })
        .then(function (contributorAddress1) {
            assert.equal(contributorAddress1, contributor, "contributor was not saved?");
            return productPayment.contributions(contributorAddress1);
        })
        .then(function (contribution2) {
            assert.equal(contribution2.valueOf(), 543, "contribution not kept");
            return productPayment.isPaid();
        })
        .then(function (isPaid3) {
            assert.isFalse(isPaid3);
            return web3.eth.getTransactionReceiptMined(web3.eth.sendTransaction({
                from: contributor, 
                to: productPayment.address,
                value: 111,
                gas: 1000000
            }));
        })
        .then(function (receipt4) {
            assert.isAtMost(receipt4.gasUsed, 200000, "Not all gas should have been consumed");
            return productPayment.contributors(1);
        })
        .then(function (contributorAddress5) {
            assert.equal(contributorAddress5, contributor, "contributor was not saved?");
            return productPayment.getContributorsCount();
        })
        .then(function (contributorCount6) {
            assert.equal(contributorCount6, 2, "contributor should not have been saved again");
            return productPayment.contributions(contributor);
        })
        .then(function (contribution7) {
            assert.equal(contribution7.valueOf(), 654, "contribution not kept");
            return productPayment.isPaid();
        })
        .then(function (isPaid8) {
            assert.isFalse(isPaid8);
        })
        .then(done)
        .catch(done);

  });

  it("should deploy a new productPayment again", function (done) {

    ProductPayment.new(
        web3.toWei(100, "finney"),
        owner,
        { from: owner })
      .then(function (newProductPayment) {
        productPayment = newProductPayment;
      })
      .then(done)
      .catch(done);

  });

  it("should be possible to pass more than the price in 1 go", function (done) {

    assert.equal(
        web3.eth.getBalance(beneficiary).valueOf(),
        0,
        "beneficiary should start at 0");

    txn0 = web3.eth.sendTransaction({
            from: contributor, 
            to: productPayment.address,
            value: web3.toWei(1, "ether"),
            gas: 2000000
        });

    web3.eth.getTransactionReceiptMined(txn0)
        .then(function (receipt1) {
            assert.isAtMost(receipt1.gasUsed, 200000, "not all gas should have been used");
            console.log(web3.eth.getBalance(beneficiary).toString());
            // assert.equal(
            //     web3.eth.getBalance(beneficiary).valueOf(),
            //     web3.toWei(100, "finney"),
            //     "beneficiary should have received");
            assert.equal(
                web3.eth.getBalance(productPayment.address),
                0,
                "contract should be empty");
            return productPayment.isPaid();
        })
        .then(function (isPaid2) {
            assert.isTrue(isPaid2);
        })
        .then(done)
        .catch(done);

  });

});