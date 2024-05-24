// SPDX-License-Identifier: MIT
//import "./lptoken.sol";
//import "./IERC20.sol";
//import "./IERC20.sol";
import "./lptoken.sol";
import"./IWETH.sol";

//import "./IWETH.sol";

pragma solidity ^0.8.17;

contract AMM {
//全局变量


    uint constant ONE_ETH = 10 ** 18;
    mapping(address => address) public pairCreator;//lpAddr pairCreator
    address [] public lpTokenAddressList;//lptoken的数组
    mapping(address => mapping(address => uint)) reserve;//第一个address是lptoken的address ，第2个是相应token的资产，uint是资产的amount

    //检索lptoken
    mapping(address => mapping(address => address)) findLpToken;
    IWETH immutable WETH;
    address immutable WETHAddr;

    //borrow slot
    mapping (address => mapping (address => uint)) public findAllUserDebt;
    mapping (address => mapping (address => uint)) public findBorrowedAmount; // lpaddr tokenaddr amount
    mapping (address =>mapping (address => mapping (address => uint))) public findUserBorrowedAmount;//user lpaddr tokenAddr amount
    mapping (address =>mapping (address =>mapping (address => uint))) public findUserDepositAmount;//user lpaddr tokenAddr amount
    mapping (address => mapping (address => uint)) public findDepositAmount;//lpaddr tokenAddr amount
    mapping (address => bool) public tokenWhiteList;

    //2.0
    mapping (address => uint) public lpETHBalance; //lp token amount
    mapping (address => mapping (address => uint)) public userLpETHBalance;

    mapping (address =>mapping (address => uint)) public liquidatePool;//lp token amount

    //short

    mapping (address => mapping (address => uint)) public wethVault;




    constructor(address _wethAddr)
    {
        WETH = IWETH(_wethAddr);
        WETHAddr = _wethAddr;
    }

    receive() payable external {}

    modifier reEntrancyMutex() {
        bool _reEntrancyMutex;

        require(!_reEntrancyMutex,"FUCK");
        _reEntrancyMutex = true;
        _;
        _reEntrancyMutex = false;

    }

//业务合约
    //添加流动性

    function addLiquidityWithETH(address _token, uint _tokenAmount) public payable reEntrancyMutex
    {
        uint ETHAmount = msg.value;
        address user = msg.sender;
       // address addr = address(this);
        WETH.depositETH{value : ETHAmount}();
        //WETH.approve(user,ETHAmount);
        WETH.transfer(user,ETHAmount);
        addLiquidity(WETHAddr,_token, ETHAmount,_tokenAmount);

    }

    function calAddLiauidityAmount(address _token0, address _token1, uint _amount0) public view returns(uint addToken1Amount){
        address lptokenAddr = findLpToken[_token0][_token1];
        require(lptokenAddr != address(0),"lp pair not created!");
        require(_amount0 > 0 ,"require _amount0 > 0 && _amount1 >0");
        require(_token0 != _token1, "_token0 == _token1");

        addToken1Amount = reserve[lptokenAddr][_token1] * _amount0 / reserve[lptokenAddr][_token0];
    }



    function addLiquidity(address _token0, address _token1, uint _amount0,uint _amount1) public returns (uint shares) {
        
        Lp lptoken;//lptoken接口，为了mint 和 burn lptoken
        
        require(_amount0 > 0 ,"require _amount0 > 0 && _amount1 >0");
        require(_token0 != _token1, "_token0 == _token1");
        IERC20 token0 = IERC20(_token0);
        IERC20 token1 = IERC20(_token1);
        token0.transferFrom(msg.sender, address(this), _amount0);
        
        address lptokenAddr;
        //force cal amount1
        if (findLpToken[_token1][_token0] != address(0)) {
            lptokenAddr = findLpToken[_token1][_token0];
            _amount1 = reserve[lptokenAddr][_token1] * _amount0 / reserve[lptokenAddr][_token0];


            token1.transferFrom(msg.sender, address(this), _amount1);
        }

        if (findLpToken[_token1][_token0] == address(0)) {
            //当lptoken = 0时，创建lptoken
            shares = _sqrt(_amount0 * _amount1);
            createPair(_token0,_token1);
            lptokenAddr = findLpToken[_token1][_token0];
            
            lptoken = Lp(lptokenAddr);//获取lptoken地址

            
            pairCreator[lptokenAddr] = msg.sender;

            token1.transferFrom(msg.sender, address(this), _amount1);

            
            
        } else {
            lptoken = Lp(lptokenAddr);//获取lptoken地址
            shares = _min(
                (_amount0 * lptoken.totalSupply()) / reserve[lptokenAddr][_token0],
                (_amount1 * lptoken.totalSupply()) / reserve[lptokenAddr][_token1]
            );
            //获取lptoken地址
        }
        require(shares > 0, "shares = 0");
        //require(1== 0, "3");
        lptoken.mint(msg.sender,shares);

        
        

        _update(lptokenAddr,_token0, _token1, reserve[lptokenAddr][_token0] + _amount0, reserve[lptokenAddr][_token1] + _amount1);
    }
    //移除流动性

    function removeLiquidity(
        address _token0,
        address _token1,
        uint _shares
    ) external returns (uint amount0, uint amount1) {
        Lp lptoken;//lptoken接口，为了mint 和 burn lptoken
        IERC20 token0 = IERC20(_token0);
        IERC20 token1 = IERC20(_token1);
        address lptokenAddr = findLpToken[_token0][_token1];

        lptoken = Lp(lptokenAddr);

        if(pairCreator[lptokenAddr] == msg.sender)
        {
            require(lptoken.balanceOf(msg.sender) - _shares > 1 ,"paieCreator should left 100 wei lptoken in pool");
        }

        amount0 = (_shares * reserve[lptokenAddr][_token0]) / lptoken.totalSupply();//share * totalsuply/bal0
        amount1 = (_shares * reserve[lptokenAddr][_token1]) / lptoken.totalSupply();
        require(amount0 > 0 && amount1 > 0, "amount0 or amount1 = 0");

        lptoken.burn(msg.sender, _shares);
        _update(lptokenAddr,_token0, _token1, reserve[lptokenAddr][_token0] - amount0, reserve[lptokenAddr][_token1] - amount1);
        

        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);
    }

    //交易

    // function swapWithETH(address _tokenOut,uint _disirSli) public payable reEntrancyMutex
    // {
    //     uint amountIn = msg.value;
    //     WETH.depositETH{value : amountIn}();
    //     swapByLimitSli(WETHAddr,_tokenOut,amountIn, _disirSli);
    // }


    // function swapToETH(address _tokenIn, uint _amountIn, uint _disirSli)public {
    //     uint amountOut = swapByLimitSli(_tokenIn,WETHAddr,_amountIn, _disirSli);
    //     WETH.withdrawETH(amountOut);
    //     address payable user = payable(msg.sender);
    //     user.transfer(amountOut);

    // }


    function swap(address _tokenIn, address _tokenOut, uint _amountIn) public returns (uint amountOut) {
        require(
            findLpToken[_tokenIn][_tokenOut] != address(0),
            "invalid token"
        );
        require(_amountIn > 0, "amount in = 0");
        require(_tokenIn != _tokenOut);
        require(_amountIn >= 1000, "require amountIn >= 1000 wei token");

        //variable

        IERC20 tokenIn = IERC20(_tokenIn);
        IERC20 tokenOut = IERC20(_tokenOut);
        address lptokenAddr = findLpToken[_tokenIn][_tokenOut];
        uint reserveIn = reserve[lptokenAddr][_tokenIn];
        uint reserveOut = reserve[lptokenAddr][_tokenOut];

        

        //swap logic

        tokenIn.transferFrom(msg.sender, address(this), _amountIn);


        uint amountInWithFee = (_amountIn * 997) / 1000;
        amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

        require(amountOut <= reserveOut/3,"max buy amount limited 1/3 reserve");

        tokenOut.transfer(msg.sender, amountOut);
        

        //update data
        uint totalReserve0 = reserve[lptokenAddr][_tokenIn] + _amountIn; 
        uint totalReserve1 = reserve[lptokenAddr][_tokenOut] - amountOut;

        _update(lptokenAddr,_tokenIn, _tokenOut, totalReserve0, totalReserve1);
    }
    //交易携带滑点限制
    function swapByLimitSli(address _tokenIn, address _tokenOut, uint _amountIn, uint _disirSli) public returns(uint amountOut){
        require(
            findLpToken[_tokenIn][_tokenOut] != address(0),
            "invalid token"
        );
        require(_amountIn > 0, "amount in = 0");
        require(_tokenIn != _tokenOut);
        require(_amountIn >= 1000, "require amountIn >= 1000 wei token");

        IERC20 tokenIn = IERC20(_tokenIn);
        IERC20 tokenOut = IERC20(_tokenOut);
        address lptokenAddr = findLpToken[_tokenIn][_tokenOut];
        uint reserveIn = reserve[lptokenAddr][_tokenIn];
        uint reserveOut = reserve[lptokenAddr][_tokenOut];

        tokenIn.transferFrom(msg.sender, address(this), _amountIn);



        uint amountInWithFee = (_amountIn * 997) / 1000;
        amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

        //检查滑点
        setSli(amountInWithFee,reserveIn,reserveOut,_disirSli);


        tokenOut.transfer(msg.sender, amountOut);
        uint totalReserve0 = reserve[lptokenAddr][_tokenIn] + _amountIn; 
        uint totalReserve1 = reserve[lptokenAddr][_tokenOut] - amountOut;

        _update(lptokenAddr,_tokenIn, _tokenOut, totalReserve0, totalReserve1);

    }

//borrow logic

    function stakeETHAndBorrow(uint _borrowRate, address _token)public payable {
        


        require((_borrowRate <= 70) && (_borrowRate > 0),"max borrowRate 70");
        IERC20 token = IERC20(_token);
        uint ETHAmount = msg.value;
        address user = msg.sender;
       // address addr = address(this);
        WETH.depositETH{value : ETHAmount}();
        //WETH.approve(user,ETHAmount);
        WETH.transfer(user,ETHAmount);

        WETH.transferFrom(user, address(this), ETHAmount);

        address lpAddr = findLpToken[WETHAddr][_token];
        uint borrowAmount;

        lpETHBalance[lpAddr] += ETHAmount;
        userLpETHBalance[user][lpAddr] += ETHAmount;

        
        borrowAmount = calSwapTokenOutAmount(WETHAddr,_token , ETHAmount) * _borrowRate / 100;
        findBorrowedAmount[lpAddr][_token] += borrowAmount;
        findUserBorrowedAmount[user][lpAddr][_token] += borrowAmount;

        token.transfer(user, borrowAmount);



    }

    function calStakeETHAndBorrow(uint _borrowRate, address _token,uint ETHAmount)public view returns(uint borrowAmount) {
        


       


        //address lpAddr = findLpToken[WETHAddr][_token];
        //uint borrowAmount;



        
        borrowAmount = calSwapTokenOutAmount(WETHAddr,_token , ETHAmount) * _borrowRate / 100;





    }

    //short

    function shortToken(uint _borrowRate,address _token) public payable  {
        IERC20 token = IERC20(_token);
        uint ETHAmount = msg.value;
        address user = msg.sender;
       // address addr = address(this);
        WETH.depositETH{value : ETHAmount}();
        //WETH.approve(user,ETHAmount);
        WETH.transfer(user,ETHAmount);

        WETH.transferFrom(user, address(this), ETHAmount);

        address lpAddr = findLpToken[WETHAddr][_token];
        uint borrowAmount;

        lpETHBalance[lpAddr] += ETHAmount;
        userLpETHBalance[user][lpAddr] += ETHAmount;

        
        borrowAmount = calSwapTokenOutAmount(WETHAddr,_token , ETHAmount) * _borrowRate / 100;
        findBorrowedAmount[lpAddr][_token] += borrowAmount;
        findUserBorrowedAmount[user][lpAddr][_token] += borrowAmount;

        token.transfer(user, borrowAmount);

        //sell debt to asset
        uint swapWethAmount;

        swapWethAmount = calSwapTokenOutAmount(_token, WETHAddr, borrowAmount);

        swap(_token, WETHAddr, borrowAmount);
        WETH.transferFrom(msg.sender, address(this), swapWethAmount);
        wethVault[msg.sender][lpAddr] += swapWethAmount;

        

    }

    function closeShortPosition(address _token,uint _amount) public {
        address lpAddr = findLpToken[WETHAddr][_token];
        //uint debt = findUserBorrowedAmount[msg.sender][lpAddr][_token];
        //uint calDebt = calSwapTokenOutAmount(WETHAddr, _token, _amount);
        //uint payOutPercent = ONE_ETH * _amount / wethVault[msg.sender][lpAddr];

        //swap to token redeem eth
        uint swapTokenAmount = calSwapTokenOutAmount(WETHAddr, _token, _amount);
        if(swapTokenAmount <= findUserBorrowedAmount[msg.sender][lpAddr][_token]){
            //AMM.swap(WETHAddr, _token, _amount);
            redeemETH(msg.sender,_token, swapTokenAmount);
            //WETH.transfer(msg.sender, _amount);
            wethVault[msg.sender][lpAddr] -= _amount;
        }else {
            uint swapAllDebtWethAmountIn = calSwapTokenInAmount(WETHAddr, _token, findUserBorrowedAmount[msg.sender][lpAddr][_token]);
            //AMM.swap(WETHAddr, _token,swapAllDebtWethAmountIn);
            redeemETH(msg.sender,_token, swapAllDebtWethAmountIn);

            WETH.transfer(msg.sender, _amount-swapAllDebtWethAmountIn);
            wethVault[msg.sender][lpAddr] -= _amount;

            //return calRedeemETHAmount(_token, findUserBorrowedAmount[msg.sender][lpAddr][_token]) + _amount - swapAllDebtWethAmountIn;
        }


    }

    function calShortTokenSwapAmount(address _user,address _token,uint _amount)public view returns(uint){
        
        address lpAddr = findLpToken[WETHAddr][_token];
        //uint debt = findUserBorrowedAmount[msg.sender][lpAddr][_token];
        //uint calDebt = calSwapTokenOutAmount(WETHAddr, _token, _amount);
        //uint payOutPercent = ONE_ETH * _amount / wethVault[msg.sender][lpAddr];

        //swap to token redeem eth

        uint swapTokenAmount = calSwapTokenOutAmount(WETHAddr, _token, _amount);
        if(swapTokenAmount > findUserBorrowedAmount[_user][lpAddr][_token]){
            uint swapAllDebtWethAmountIn = calSwapTokenInAmount(WETHAddr, _token, findUserBorrowedAmount[_user][lpAddr][_token]);
            return calRedeemETHAmount( _user,_token, findUserBorrowedAmount[_user][lpAddr][_token]) + _amount - swapAllDebtWethAmountIn;

        }else{
            return calRedeemETHAmount(_user,_token, swapTokenAmount);
        }
        //calRedeemETHAmount(_token, swapTokenAmount);
        //swap(WETHAddr, _token, _amount);
        //redeemETH(_token, swapTokenAmount);
        //WETH.transfer(msg.sender, _amount);
        
    }



    function redeemETH(address _user,address _token,uint _amount)public {
        require((msg.sender == address(this))||(msg.sender == _user),"not user or this contract");
        address lpAddr = findLpToken[WETHAddr][_token];
        
        uint ethAmount;

        //address user = msg.sender;
        uint debt = findUserBorrowedAmount[_user][lpAddr][_token];
        require(_amount <= debt,"repayamount must less than debt");
        uint percent = ONE_ETH * _amount / debt;
        address payable userp = payable (_user);
        

       

        ethAmount = percent * userLpETHBalance[_user][lpAddr] / ONE_ETH;

        WETH.withdrawETH(ethAmount);
        userp.transfer(ethAmount);

        findBorrowedAmount[lpAddr][_token] -= _amount;
        findUserBorrowedAmount[_user][lpAddr][_token] -= _amount;

        lpETHBalance[lpAddr] -= ethAmount;
        userLpETHBalance[_user][lpAddr] -= ethAmount;

        
        
    }


    function calRedeemETHAmount(address user,address _token,uint _amount)public view returns(uint){
        address lpAddr = findLpToken[WETHAddr][_token];
        
        uint ethAmount;

        //address user = msg.sender;
        uint debt = findUserBorrowedAmount[user][lpAddr][_token];
        require(_amount <= debt,"repayamount must less than debt");
        uint percent = ONE_ETH * _amount / debt;
        //address payable userp = payable (msg.sender);
        

        ethAmount = percent * userLpETHBalance[user][lpAddr] / ONE_ETH;

        return ethAmount;
    }

    function calHelthyFactor(address _user,address _token)public view returns(uint principal,uint userWethLpDebt , uint currentPosition,uint helthyFactor){
        address lpAddr;
        uint userPrincipalSwapToToken;
        uint userTokenDebt;
        //uint helthyFactor;
        lpAddr = findLpToken[_token][WETHAddr];
        userTokenDebt = findUserBorrowedAmount[_user][lpAddr][_token];
        principal = userLpETHBalance[_user][lpAddr];
       //lpAsset = findUserBorrowedAmount[_user][lpAddr][_token];
        userPrincipalSwapToToken = calSwapTokenOutAmount(WETHAddr, _token, principal);

        //uint lpWethDebt = calSwapTokenOutAmount(_token, WETHAddr, userLpDebt);
        //userWethLpDebt = calSwapTokenOutAmount(_token, WETHAddr, userLpDebt);

        //70% liquidate
        

        helthyFactor = ONE_ETH * userTokenDebt/userPrincipalSwapToToken;
        // = wethVault[lpAddr][_user];
        currentPosition = calShortTokenSwapAmount(_user, _token, wethVault[_user][lpAddr]);


    }

    function liquidateWethLp(address _user,address _token) public {
        /*
        1.计算当前的weth可以换多少的token
        2.对比兑换token的数量
        3.对比数量和健康因子
        4.清算
        5.计算精准的tokenin
        6，计算差额
        7.利润分配
        */
        //IERC20 token = IERC20(_token);
        address lpAddr;
        uint lpAsset;
        //uint lpDebt;
        uint helthyFactor;
        uint tokenDebt;
        lpAddr = findLpToken[_token][WETHAddr];
        tokenDebt = findBorrowedAmount[lpAddr][_token];
        lpAsset = findUserBorrowedAmount[_user][lpAddr][_token];

        //uint lpWethDebt = calSwapTokenOutAmount(_token, WETHAddr, lpDebt);

        //70% liquidate
        

        (,,,helthyFactor) = calHelthyFactor(_user, _token);


        if(helthyFactor >= 8*10**17){
            uint calTokenOutAmount;

            AMM.swap(WETHAddr, _token, userLpETHBalance[_user][lpAddr]);
            calTokenOutAmount =  calSwapTokenOutAmount(WETHAddr, _token, userLpETHBalance[_user][lpAddr]);
            


            if(tokenDebt < calTokenOutAmount){

                uint profit;
                profit = calTokenOutAmount - tokenDebt;

                WETH.transfer(msg.sender, profit/2);
                liquidatePool[lpAddr][_token] += profit/2;
                
                //findUserBorrowedAmount[_user][lpAddr][_token]
                findUserBorrowedAmount[_user][lpAddr][_token] = 0;
                userLpETHBalance[_user][lpAddr] = 0;

            }else{
                findUserBorrowedAmount[_user][lpAddr][_token] = 0;
                userLpETHBalance[_user][lpAddr] = 0;
            }

            
        

        }



        


    }



    function calSwapTokenOutAmount(address _tokenIn, address _tokenOut, uint _amountIn) public view returns (uint amountOut) {
        require(
            findLpToken[_tokenIn][_tokenOut] != address(0),
            "invalid token"
        );
        require(_amountIn > 0, "amount in = 0");
        require(_tokenIn != _tokenOut);
        //require(_amountIn >= 1000, "require amountIn >= 1000 wei token");

        //variable

        address lptokenAddr = findLpToken[_tokenIn][_tokenOut];
        uint reserveIn = reserve[lptokenAddr][_tokenIn];
        uint reserveOut = reserve[lptokenAddr][_tokenOut];

        //swap logic



        uint amountInWithFee = (_amountIn * 997) / 1000;
        amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
    }

    function calSwapTokenInAmount(address _tokenIn, address _tokenOut, uint _amountOut) public view returns (uint amountInWithFee) {
        require(
            findLpToken[_tokenIn][_tokenOut] != address(0),
            "invalid token"
        );
        require(_amountOut > 0, "amount in = 0");
        require(_tokenIn != _tokenOut);
        //require(_amountIn >= 1000, "require amountIn >= 1000 wei token");

        //variable

        address lptokenAddr = findLpToken[_tokenIn][_tokenOut];
        uint reserveIn = reserve[lptokenAddr][_tokenIn];
        uint reserveOut = reserve[lptokenAddr][_tokenOut];

        //swap logic



        //uint amountInWithFee = (_amountIn * 997) / 1000;
        // amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
        // amountOut*(reserveIn + amountInWithFee) = (reserveOut * amountInWithFee);
        // amountOut*amountInWithFee + amountOut*reserveIn = reserveOut * amountInWithFee;
        // amountOut*amountInWithFee - reserveOut * amountInWithFee= amountOut*reserveIn
        // amountInWithFee(reserveOut - amountOut) = amountOut*reserveIn;
        uint amountIn = _amountOut*reserveIn/(reserveOut - _amountOut);
        amountInWithFee = amountIn*1000/997;




    }

    // function calAssetAmountWithEth(address _tokenIn) public view returns(uint){
    //     uint wethAsset;
    //     uint tokenInAsset;
        
    //     tokenInAsset = calSwapTokenOutAmount(WETHAddr, _tokenIn, findUserDepositAmount[msg.sender][findLpToken[_tokenIn][WETHAddr]][_tokenIn]);
    //     wethAsset = reserve[findLpToken[WETHAddr][_tokenIn]][WETHAddr];
    //     return wethAsset + tokenInAsset;
    // }

    // function calDebtAmountWithEth(address _tokenIn) public view returns(uint){
    //     uint wethDebt = reserve[findLpToken[WETHAddr][_tokenIn]][WETHAddr];
    //     uint tokenInDebt;
    //     tokenInDebt = calSwapTokenOutAmount(_tokenIn, WETHAddr, findUserBorrowedAmount[msg.sender][findLpToken[_tokenIn][WETHAddr]][_tokenIn]);
    //     return wethDebt + tokenInDebt;
    // }

    // function calUserAssetAmountWithEth(address _user, address _tokenIn) public view returns(uint){
    //     uint wethAsset;
    //     uint tokenInAsset;

    //     //to do list
        
    //     tokenInAsset = calSwapTokenOutAmount(WETHAddr, _tokenIn, findUserDepositAmount[_user][findLpToken[_tokenIn][WETHAddr]][_tokenIn]);
    //     wethAsset = reserve[findLpToken[WETHAddr][_tokenIn]][WETHAddr];
    //     return wethAsset + tokenInAsset;
    // }

    function calUserDebtAmountWithEth(address _user, address _tokenIn) public view returns(uint){
        uint wethDebt = reserve[findLpToken[WETHAddr][_tokenIn]][WETHAddr];
        uint tokenInDebt;
        tokenInDebt = calSwapTokenOutAmount(_tokenIn, WETHAddr, findUserBorrowedAmount[_user][findLpToken[_tokenIn][WETHAddr]][_tokenIn]);
        return wethDebt + tokenInDebt;
    }

    function depositToken(address _tokenA,address _tokenB,address _token,uint _amount) public{
        require((_token == _tokenA) || (_token == _tokenB),"invalid token");
        address lpAddr = findLpToken[_tokenA][_tokenB];
        address user = msg.sender; 
        IERC20 token = IERC20(_token);
        token.transferFrom(user, address(this), _amount);

        findUserDepositAmount[user][lpAddr][_token] += _amount;
        findDepositAmount[lpAddr][_token] += _amount;
    }
    function withdrawToken(address _tokenA,address _tokenB,address _token,uint _amount) public {
        require((_token == _tokenA) || (_token == _tokenB),"invalid token");
        address lpAddr = findLpToken[_tokenA][_tokenB];
        address user = msg.sender; 
        IERC20 token = IERC20(_token);
        token.transfer(user, _amount);

        findUserDepositAmount[user][lpAddr][_token] -= _amount;
        findDepositAmount[lpAddr][_token] -= _amount;
    }
    


    // function borrowToken(address _tokenA,address _tokenB,address _token,uint _amount) public {


    //     require((_token == _tokenA) || (_token == _tokenB),"invalid token");
    //     address lpAddr = findLpToken[_tokenA][_tokenB];
    //     uint tokenReserve = reserve[lpAddr][_token];
    //     require(_amount < tokenReserve,"require smaller than reserve");
    //     IERC20 token = IERC20(_token);
    //     address user = msg.sender;

    //     token.transfer(msg.sender, _amount);

    //     //get debt rate
    //     //demical 1-10000

    //     //uint tokenReserve = getReserve(findLpToken[_tokenA][ _tokenB], _token);

    //     uint tokenBorrowed = findBorrowedAmount[findLpToken[_tokenA][ _tokenB]][ _token];
    //     uint tokenBorrowedRate;

    //     if((tokenBorrowed * ONE_ETH > tokenReserve)){
    //         tokenBorrowedRate = ONE_ETH * (tokenBorrowed + _amount) / tokenReserve;
    //     }else{
    //         tokenBorrowedRate = 0;
    //     }





    //     // uint rate;
    //     uint demical;


    //     // if(_token == _tokenA){
    //     //     (,,,,rate,,,,,) = getLpInfo(_tokenA,_tokenB);
    //     // }else{
    //     //     (,,,,,rate,,,,) = getLpInfo(_tokenA,_tokenB);
    //     // }

    //     demical = tokenBorrowedRate / 10**14;


    //     //10% 1
    //     //20% 3
    //     //30% 5
    //     //40% 10
    //     //50% 20
    //     //60% 40
    //     //70% 50
    //     //80-100 no
    //     require(demical < 8000,"not liquidity now");
    //     uint debt;
    //     if(demical<1000){
    //         debt = (_amount + _amount/100);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }else if(demical<2000){
    //         debt = (_amount + _amount/30);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }else if(demical<3000){
    //         debt = (_amount + _amount/15);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }else if(demical<4000){
    //         debt = (_amount + _amount/8);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }else if(demical<5000){
    //         debt = (_amount + _amount/5);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }else if(demical<6000){
    //         debt = (_amount + _amount/3);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }else if(demical<7000){
    //         debt = (_amount + _amount/2);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }else if(demical<8000){
    //         debt = (_amount + _amount);
    //         findUserBorrowedAmount[user][lpAddr][_token] += debt;
    //     }


    //     findAllUserDebt[lpAddr][_token] += debt;
    //     //findUserBorrowedAmount[user][lpAddr][_token] += _amount;
    //     //findBorrowedAmount[lpAddr][_token] += _amount;
    // }

    function borrowToken2(address _user,address _tokenA,address _tokenB,address _token,uint _amount) public {

        require((_token == _tokenA) || (_token == _tokenB),"invalid token");
        require(findLpToken[_tokenA][_tokenB] != address(0),"lp pair not existed");
        address lpAddr = findLpToken[_tokenA][_tokenB];
        uint tokenReserve = reserve[lpAddr][_token];
        
        IERC20 token = IERC20(_token);

        token.transfer(_user, _amount);

        //get debt rate
        //demical 1-10000

        //uint tokenReserve = getReserve(findLpToken[_tokenA][ _tokenB], _token);

        //判断tokenborrowed rate 来确定借出偿还的比例

        uint tokenBorrowed = findBorrowedAmount[findLpToken[_tokenA][ _tokenB]][ _token];
        require((_amount +  tokenBorrowed) < tokenReserve,"require smaller than reserve");
        uint tokenBorrowedRate;


        //????
        if((tokenBorrowed * ONE_ETH > tokenReserve)){
            tokenBorrowedRate = ONE_ETH * (tokenBorrowed + _amount) / tokenReserve;
        }else{
            tokenBorrowedRate = 0;
        }





        // uint rate;
        uint demical;


        // if(_token == _tokenA){
        //     (,,,,rate,,,,,) = getLpInfo(_tokenA,_tokenB);
        // }else{
        //     (,,,,,rate,,,,) = getLpInfo(_tokenA,_tokenB);
        // }

        demical = tokenBorrowedRate / 10**14;


        //10% 1
        //20% 3
        //30% 5
        //40% 10
        //50% 20
        //60% 40
        //70% 50
        //80-100 no

        //暂时封存
        //require(demical < 8000,"not liquidity now");
        // uint debt;
        // if(demical<1000){
        //     debt = (_amount + _amount/100);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }else if(demical<2000){
        //     debt = (_amount + _amount/30);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }else if(demical<3000){
        //     debt = (_amount + _amount/15);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }else if(demical<4000){
        //     debt = (_amount + _amount/8);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }else if(demical<5000){
        //     debt = (_amount + _amount/5);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }else if(demical<6000){
        //     debt = (_amount + _amount/3);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }else if(demical<7000){
        //     debt = (_amount + _amount/2);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }else if(demical<8000){
        //     debt = (_amount + _amount);
        //     findUserBorrowedAmount[user][lpAddr][_token] += debt;
        // }


        // findAllUserDebt[lpAddr][_token] += debt;

    }

    //repay logic


    //liquidate
    function liquidate(address _user,address _tokenA,address _tokenB,address _token) public {
        /*
        1.search lp 
        2.search user debt
        3.search lp 
        4.health factor
        5.liquidate
        */

        require((_token == _tokenA) || (_token == _tokenB),"invalid token");
        
        address lpAddr = findLpToken[_tokenA][_tokenB];

        uint userAsset;
        uint userDebt;
        uint healthyFactor;
        require(userAsset > 0,"this user not any asset");
        healthyFactor = userDebt*ONE_ETH/userAsset;

        if(healthyFactor > 8*10**17){
            //liquidate logic
            /*
            1.user asset = 0;
            2.user asset transfer to
            */
            findUserDepositAmount[_user][lpAddr][_tokenA] = 0;
            findUserDepositAmount[_user][lpAddr][_tokenB] = 0;
        }
        
        


    }

//外部调用借出lp接口
    function borrowLpToken(address _tokenA, address _tokenB ,address _token, uint _amount) public{
        //require((_token == _tokenA) || (_token == _tokenB),"invalid token");
        address lpAddr = findLpToken[_tokenA][_tokenB];
        require(lpAddr != address(0),"lp pair not existed");

        
        uint tokenReserve = reserve[lpAddr][_token];

        require((_amount +  findBorrowedAmount[lpAddr][ _token]) < tokenReserve,"require smaller than reserve");
        
        IERC20 token = IERC20(_token);
        address user = msg.sender;

        token.transfer(msg.sender, _amount);

        //get debt rate
        //demical 1-10000

        //uint tokenReserve = getReserve(findLpToken[_tokenA][ _tokenB], _token);

        //判断tokenborrowed rate 来确定借出偿还的比例

        findBorrowedAmount[lpAddr][ _token] += _amount;


    }

    //interest cal logic
    // 按照被借出的梯度来算，0-10不用还，10 - 20  5%
    //20-30 10%
    //30-40 20%
    //40-50 30%
    //50-60 50%
    //60-70 100%
    //70-100 0000



    //暴露数据查询方法

    function getReserve(address _lpTokenAddr, address _tokenAddr) public view returns(uint)
    {
        return reserve[_lpTokenAddr][_tokenAddr];
    }

    function getLptoken(address _tokenA, address _tokenB) public view returns(address)
    {
        return findLpToken[_tokenA][_tokenB];
    }

    // function getWethLpinfoForUser(address _tokenA,address _tokenB,address _user) public view returns(uint userWethBalance,uint userTokenDebt,uint wethBorrowed,uint tokenBorrowed,uint wethBorrowedRate,uint tokenBorrowedRate,uint helthyFactor){
    //     require((_tokenA == WETHAddr)||(_tokenB == WETHAddr),"require weth in lp");
    //     address lpAddr = findLpToken[_tokenA][_tokenB];

    //     userLpDebt = findUserBorrowedAmount[_user][lpAddr][_token];
    //    //lpAsset = findUserBorrowedAmount[_user][lpAddr][_token];

    //     uint lpWethDebt = calSwapTokenOutAmount(_token, WETHAddr, userLpDebt);

    //     //lpDebt = findBorrowedAmount[lpAddr][_token];
    //     //lpAsset = findUserBorrowedAmount[_user][lpAddr][_token];

    //     if(_tokenA == WETHAddr){
    //         wethLiquidityReserve = getReserve(findLpToken[_tokenA][ _tokenB], _tokenA);
    //         tokenLiquidityReserve = getReserve(findLpToken[_tokenA][ _tokenB], _tokenB);

    //         findUserBorrowedAmount[_user][lpAddr][_token]

    //         wethBorrowed = findBorrowedAmount[lpAddr][_tokenA] / wethLiquidityReserve;
    //         tokenBorrowed = findBorrowedAmount[lpAddr][_tokenB] / tokenLiquidityReserve;

            

    //         wethBorrowedRate = ONE_ETH * wethBorrowed/wethLiquidityReserve;
    //         tokenBorrowedRate = ONE_ETH * tokenBorrowed/tokenLiquidityReserve;

    //         helthyFactor = calHealthyFactor(_user, _tokenB);




    //     }else{
    //         wethLiquidityReserve = getReserve(findLpToken[_tokenA][ _tokenB], _tokenB);
    //         tokenLiquidityReserve = getReserve(findLpToken[_tokenA][ _tokenB], _tokenA);   

    //         wethBorrowed = findBorrowedAmount[lpAddr][_tokenB] / wethLiquidityReserve;
    //         tokenBorrowed = findBorrowedAmount[lpAddr][_tokenA] / tokenLiquidityReserve;  

    //         wethBorrowedRate = ONE_ETH * wethBorrowed/wethLiquidityReserve;
    //         tokenBorrowedRate = ONE_ETH * tokenBorrowed/tokenLiquidityReserve; 

    //         helthyFactor = calHealthyFactor(_user, _tokenA);


    //     }

        

        


        


    //}

    function getLpInfo(address _tokenA,address _tokenB) public view returns(uint tokenALiquidityReserve,uint tokenBLiquidityReserve,uint tokenABorrowed,uint tokenBBorrowed,uint tokenABorrowedRate,uint tokenBBorrowedRate,uint lpTokenAApr,uint lpTokenBApr,uint borrowederTokenAApr,uint borrowederTokenBApr){
        tokenALiquidityReserve = getReserve(findLpToken[_tokenA][ _tokenB], _tokenA);
        tokenBLiquidityReserve = getReserve(findLpToken[_tokenA][ _tokenB], _tokenB);
        tokenABorrowed = findBorrowedAmount[findLpToken[_tokenA][ _tokenB]][ _tokenA];
        tokenBBorrowed = findBorrowedAmount[findLpToken[_tokenA][ _tokenB]][ _tokenB];
        if((tokenABorrowed * ONE_ETH > tokenALiquidityReserve)){
            tokenABorrowedRate = ONE_ETH * tokenABorrowed / tokenALiquidityReserve;
        }else{
            tokenABorrowedRate = 0;
        }

        if((tokenBBorrowed * ONE_ETH > tokenBLiquidityReserve)){
            tokenBBorrowedRate = ONE_ETH * tokenBBorrowed / tokenBLiquidityReserve;
        }else{
            tokenBBorrowedRate = 0;
        }

        lpTokenAApr = tokenABorrowedRate/10**14 * tokenABorrowedRate/10**14;
        lpTokenBApr = tokenBBorrowedRate/10**14 * tokenBBorrowedRate/10**14;
        borrowederTokenAApr = lpTokenAApr + 3*10**4;
        borrowederTokenBApr = lpTokenBApr + 3*10**4;
        
    }

    // function getUserLpInfo(address _user, address _tokenA,address _tokenB) public view returns(uint userAsset,uint userDebt){

    //     require((_tokenA == WETHAddr)||(_tokenB == WETHAddr),"no weth");
    //     address tokenIn;
    //     if(_tokenA == WETHAddr){
    //         tokenIn = _tokenB;
    //     }else{
    //         tokenIn = _tokenA;
    //     }
    //     //address lpAddr = findLpToken[_tokenA][ _tokenB];


    //     userAsset = calUserAssetAmountWithEth(_user,tokenIn);
    //     userDebt = calUserDebtAmountWithEth(_user,tokenIn);

  
        


        
    // }

    function lptokenTotalSupply(address _token0, address _token1, address user) public view returns(uint)
    {
        Lp lptoken;
        lptoken = Lp(findLpToken[_token0][_token1]);
        uint totalSupply = lptoken.balanceOf(user);
        return totalSupply;
    }

    function getLptokenLength() public view returns(uint)
    {
        return lpTokenAddressList.length;
    }

//依赖方法
    //creatpair

    function createPair(address addrToken0, address addrToken1) internal {
        bytes32 _salt = keccak256(
            abi.encodePacked(
                addrToken0,addrToken1
            )
        );
        new Lp{
            salt : bytes32(_salt)
        }
        ();

        address lptokenAddr = getAddress(getBytecode(),_salt);

         //检索lptoken
        lpTokenAddressList.push(lptokenAddr);
        findLpToken[addrToken0][addrToken1] = lptokenAddr;
        findLpToken[addrToken1][addrToken0] = lptokenAddr;

    }

    function getBytecode() internal pure returns(bytes memory) {
        bytes memory bytecode = type(Lp).creationCode;
        return bytecode;
    }

    function getAddress(bytes memory bytecode, bytes32 _salt)
        internal
        view
        returns(address)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff), address(this), _salt, keccak256(bytecode)
            )
        );

        return address(uint160(uint(hash)));
    }

    //数据更新

    function _update(address lptokenAddr,address _token0, address _token1, uint _reserve0, uint _reserve1) private {
        reserve[lptokenAddr][_token0] = _reserve0;
        reserve[lptokenAddr][_token1] = _reserve1;
    }

//数学库

    function _sqrt(uint y) private pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint x, uint y) private pure returns (uint) {
        return x <= y ? x : y;
    }

    function setSli(uint dx, uint x, uint y, uint _disirSli) private pure returns(uint){


        uint amountOut = (y * dx) / (x + dx);

        uint dy = dx * y/x;
        /*
        loseAmount = Idea - ammOut
        Sli = loseAmount/Idea
        Sli = [dx*y/x - y*dx/(dx + x)]/dx*y/x
        */
        uint loseAmount = dy - amountOut;

        uint Sli = loseAmount * 10000 /dy;
        
        require(Sli <= _disirSli, "Sli too large");
        return Sli;

    }



}
