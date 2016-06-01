import "Owned.sol";

/**
 * This contract is meant:
 *   - to be created by the beneficiary account or contract.
 *   - to be sent value by the customer for the purpose of paying a course.
 */
contract ProductPayment is Owned {
	uint public price;
	address public beneficiary;
	bool public isPaid;
	mapping (address => uint) public contributions;
	address[] public contributors;

	event OnRemaining(uint indexed leftToPay);

	function ProductPayment(uint _price, address _beneficiary) {
		price = _price;
		beneficiary = _beneficiary;
	}

	modifier isNotPaidYet {
		if (isPaid) {
			throw;
		}
		_
	}

	function getContributorsCount() constant
		returns (uint count) {
		count = contributors.length;		
	}

	function setBeneficiary(address _beneficiary)
		isNotPaidYet 
		returns (bool success) {
		beneficiary = _beneficiary;
		success = true;
	}

	function refundMe() isNotPaidYet {
		if (msg.sender.send(contributions[msg.sender])) {
			contributions[msg.sender] = 0;
		}
	}

	function () isNotPaidYet {
		if (msg.value == 0) {
			throw;
		}
		if (contributions[msg.sender] == 0) {
			contributors.push(msg.sender);
		}
		if (this.balance > price) {
			uint refunded = this.balance - price;
			if (!msg.sender.send(refunded)) {
				throw;
			}
			contributions[msg.sender] += msg.value - refunded;
		} else {
			contributions[msg.sender] += msg.value;
		}
		OnRemaining(price - this.balance);
		if (this.balance == price) {
			if (!beneficiary.send(this.balance)) {
				throw;
			}
			isPaid = true;
		}
	}
}