// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Vault {

    address private owner;

    mapping (address => mapping (address => uint)) public erc20Balance; //user tokenaddress amount
    mapping (address => uint) public erc20Vault;
    mapping (address => uint) public ethBalance;
    uint public ethVault;

    fallback() external {

    }

    receive() external payable { 
    }

    bool private locked;

    modifier noReentrancy() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner(){
        require(msg.sender == owner,"only owner");
        _;
    }

    constructor(){
        owner = msg.sender;
    }




    function deposit(address _erc20,uint _amount) public {

        IERC20 erc20 = IERC20(_erc20);

        address sender = msg.sender;


        erc20.transferFrom(sender, address(this), _amount);

        erc20Balance[sender][_erc20] += _amount;
        erc20Vault[_erc20] += _amount;
        
    }

    function withdraw(address _erc20,uint _amount) public {
        

        IERC20 erc20 = IERC20(_erc20);

        address sender = msg.sender;

        require( erc20Balance[sender][_erc20] >= _amount,"not enought asset in your balance");

        erc20Balance[sender][_erc20] -= _amount;
        erc20Vault[_erc20] -= _amount;

        erc20.transfer(sender, _amount);

        
    }


    function withdrawWithOwner(address _erc20,uint _amount) public onlyOwner {
        

        IERC20 erc20 = IERC20(_erc20);

        address sender = msg.sender;

        //require( erc20Balance[sender][_erc20] >= _amount,"not enought asset in your balance");

        //erc20Balance[sender][_erc20] -= _amount;
        erc20Vault[_erc20] -= _amount;

        erc20.transfer(sender, _amount);
        
    }



    function depositETH() payable public noReentrancy{
        ethBalance[msg.sender] += msg.value;
        ethVault += msg.value;
    }

    function withdrawETHWithOwner(uint _amount) payable public noReentrancy onlyOwner{
        //require(ethBalance[msg.sender] >= _amount);
        //ethBalance[msg.sender] -= _amount;
        ethVault -= _amount;


        address payable recipient = payable (msg.sender); 
        //ethBalance[msg.sender] += msg.value;
        recipient.transfer(_amount);

    }

    function withdrawETH(uint _amount) payable public noReentrancy{
        require(ethBalance[msg.sender] >= _amount);
        ethBalance[msg.sender] -= _amount;
        ethVault -= _amount;

        
        address payable recipient = payable (msg.sender); 
        //ethBalance[msg.sender] += msg.value;
        recipient.transfer(_amount);

    }
}
