/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2024-01-02 22:05:01
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-24 22:07:37
 * @FilePath: /TheLastOneGame/pages/winner.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useContracts } from '@/hooks/useContract';
import { useAccount, useNetwork } from 'wagmi'
import ammDataABI from 'Abi/ammData.json'
import ammABI from 'Abi/amm.json'
import tokenABI from 'Abi/token.json'
import Image from 'next/image'
import { Input, Modal, Spin } from 'antd';
import styles from '@/assets/styles/createPair.module.css'
import toast from 'react-hot-toast'
import { convertToWei, weiToEth } from '@/assets/utils'
import { LoadingOutlined } from '@ant-design/icons';

const lip = () => {
    const { address } = useAccount()
    const [isDisabled, setIsDisabled] = useState(true)
    const [amountA, setamountA] = useState(0)
    const [amountB, setamountB] = useState(0)
    const [amountBdisable, setAmountBdisable] = useState(false)
    const [spinning, setSpinning] = useState(false);

    const [tokenAAddress, setTokenAAddress] = useState('0xc77560491AcA657F7b7533EEea20A08a7025d779')
    const [TokenAName, setTokenAName] = useState('0xc77560491AcA657F7b7533EEea20A08a7025d779')
    const [tokenBAddress, setTokenBAddress] = useState('')
    const [tokenBName, setTokenBName] = useState('')

    const [tokenAbanlance, setTokenAbanlance] = useState(0)
    const [tokenBbanlance, setTokenBbanlance] = useState(0)

    const [OpenTokenA, setOpenTokenIn] = useState(false);
    const [OpenTokenB, setOpenTokenOut] = useState(false);

    const ammContract = useContracts('0x1664BeDbF88DcecF2D2642D0AE797790a94c26Bd', ammABI)

    useEffect(() => {
        cacal()
        getTokenABanlance()
        getTokenBBanlance()
    }, [address])

    useEffect(() => {
        cacal()
        getTokenABanlance()
    }, [tokenAAddress])

    useEffect(() => {
        cacal()
        getTokenBBanlance()
    }, [tokenBAddress])

    useEffect(() => {
        cacal()
    }, [amountA])

    const getTokenABanlance = async () => {
        if (address === undefined) {
            return
        }

        let tokenAContract = useContracts(tokenAAddress, tokenABI)
        let res = await tokenAContract.balanceOf(address).catch(e => {
            console.log(e);
        })
        let token = Number(weiToEth(res?.toString())).toFixed(2)
        setTokenAbanlance(token)
    }

    const getTokenBBanlance = async () => {
        if (address === undefined) {
            return
        }

        let tokenOutContract = useContracts(tokenBAddress, tokenABI)
        let res = await tokenOutContract.balanceOf(address).catch(e => {
            console.log(e);
        })
        let token = Number(weiToEth(res?.toString())).toFixed(2)
        setTokenBbanlance(token)

    }

    const onChange = (e) => {
        setamountA(e.target.value);

    }

    const onAmountOutChange = (e) => {
        setamountB(e.target.value);

    }

    const tokenInChange = (e) => {
        setTokenAAddress(e.target.value)
        setTokenAName(e.target.value)
    }

    const tokenInEnter = () => {
        setOpenTokenIn(false);
    }

    const tokenOutChange = async (e) => {
        setTokenBAddress(e.target.value)
        setTokenBName(e.target.value)
    }

    const tokenOutEnter = () => {
        setOpenTokenOut(false);
    }

    const addLiquidity = async () => {
        if (address === undefined) {
            toast.error("Please connect wallet first!")
            return
        }

        if (!amountA || !amountB) {
            toast.error("Please input token amount!")
            setIsDisabled(true)
            return
        }

        if (!tokenBAddress) {
            toast.error("Please select a token!")
            setIsDisabled(true)
            return
        }

        let tokenAContract = useContracts(tokenAAddress, tokenABI)
        let tokenBContract = useContracts(tokenBAddress, tokenABI);
        const maxValue = ethers.constants.MaxUint256;
        let A = await tokenAContract.allowance(address, '0x1664BeDbF88DcecF2D2642D0AE797790a94c26Bd').catch(e => {
            console.log(e);
        })
        let allowanceA = Number(weiToEth(A.toString()))
        let B = await tokenBContract.allowance(address, '0x1664BeDbF88DcecF2D2642D0AE797790a94c26Bd').catch(e => {
            console.log(e);
        })
        let allowanceB = Number(weiToEth(B.toString()))
        console.log(amountA > allowanceA, amountB > allowanceB, allowanceA, allowanceB);
        if (amountA > allowanceA) {
            // 调用approve并等待交易响应
            const txResponse = await tokenAContract.approve('0x1664BeDbF88DcecF2D2642D0AE797790a94c26Bd', maxValue);
            // 等待交易回执
            setSpinning(true)
            await txResponse.wait();
            setSpinning(false)
            console.log('Token A approved successfully');
            if (amountB > allowanceB) {
                // 调用approve并等待交易响应
                const txResponse = await tokenBContract.approve('0x1664BeDbF88DcecF2D2642D0AE797790a94c26Bd', maxValue);
                // 等待交易回执
                setSpinning(true)
                await txResponse.wait();
                console.log('Token B approved successfully');
                setSpinning(false)
                setAddLiquidity()
            } else {
                setAddLiquidity()
            }
        } else {
            if (amountB > allowanceB) {
                // 调用approve并等待交易响应
                const txResponse = await tokenBContract.approve('0x1664BeDbF88DcecF2D2642D0AE797790a94c26Bd', maxValue);
                // 等待交易回执
                setSpinning(true)
                await txResponse.wait();
                setSpinning(false)
                console.log('Token B approved successfully');
                setAddLiquidity()
            } else {
                setAddLiquidity()
            }
        }

    }

    const setAddLiquidity = async () => {
        // 转换参数为Wei
        const params1 = convertToWei(amountA + '');
        const params2 = convertToWei(amountB + '');
        console.log(tokenBAddress);

        // 调用智能合约方法并等待交易完成
        const txResponse = await ammContract.addLiquidity(tokenAAddress, tokenBAddress, amountA, amountB);

        // 等待交易回执
        setSpinning(true)
        const txReceipt = await txResponse.wait();
        setSpinning(false)
        // 处理交易成功的回执
        console.log(txReceipt);
        toast.success('Successfully!');

        // 更新Token A和Token B的余额
        getTokenABanlance();
        getTokenBBanlance();
    }

    const handleCancelTokenIn = () => {
        setOpenTokenIn(false);
    }

    const handleCancelTokenOut = () => {
        setOpenTokenOut(false);
    }

    const selectNetworkToken = () => {
        setOpenTokenIn(true);
    }

    const selectToken = () => {
        setOpenTokenOut(true);
    }

    const cacal = async () => {
        if (!amountA || !tokenAAddress || !tokenBAddress) {
            return
        }
        let LpToken = await ammContract.getLptoken(tokenAAddress, tokenBAddress).catch(e => {
            console.log(e);
            toast.error("Please input correct address!")
            setIsDisabled(true)
        })
        console.log(LpToken, tokenAAddress, tokenBAddress);
        const normalizedAddress = LpToken?.trim().toLowerCase();

        // Define the zero address for Ethereum (40 zeros after '0x')
        const zeroAddress = '0x0000000000000000000000000000000000000000';

        if (!(normalizedAddress === zeroAddress) && LpToken) {
            setAmountBdisable(true)
            setIsDisabled(false)
            setamountB(2 * amountA)
            // const params = convertToWei(amountA + '');
            // let res = await ammContract.calSwapTokenOutAmount(tokenAAddress, tokenBAddress, amountA).catch(e => {
            //     console.log(e);
            // })
            // setamountB(res?.toString())
        } else {
            setIsDisabled(false)
        }

    }



    return (
        <div className={styles.outBox}>
            <div className={styles.cardBox}>
                <div className={styles.title}>Add Liquidity</div>
                <div className={styles.cardContent}>
                    <div className='flex justify-between'>
                        <Input className={styles.customInput} size="large" value={amountA} onChange={onChange} type="number" />
                        {TokenAName && TokenAName !== '0xc77560491AcA657F7b7533EEea20A08a7025d779' ? <div className={styles.selectBtToken} onClick={() => { selectNetworkToken() }}>
                            <div className={`${styles.rightText} + ${styles.rightBtText}`}>{TokenAName}</div>
                            <span className={styles.rightText}>
                                <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
                            </span>
                        </div> :
                            <div className={styles.rightContainer} onClick={() => { selectNetworkToken() }}>
                                <div className={styles.ethImg}><Image width={22} src="data:image/png;base64,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" alt='image' height={24} /></div>
                                <span className={styles.rightText}>WETH</span>
                                <span className={styles.rightText}>
                                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
                                </span>
                            </div>}
                    </div>

                    <div className='flex justify-between'>
                        <div className={styles.inputFoot}></div>
                        {TokenAName && address ? <div className={styles.rightText}>Balance: {tokenAbanlance}<span style={{ color: '#0E76FD', cursor: 'pointer' }}>MAX</span>  </div> : ''}
                    </div>
                </div>
                <div className='flex justify-center'>
                    <div className={styles.arrowDown}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                </div>
                <div className={styles.cardContent}>
                    <div className='flex justify-between'>
                        <div style={{ width: '55%' }}>
                            <Input className={styles.customInput} size="large" value={amountB} onChange={onAmountOutChange} type="number" disabled={amountBdisable} />
                        </div>
                        {tokenBName ?
                            <div className={styles.selectBtToken} onClick={() => { selectToken() }}>
                                <div className={`${styles.rightText} + ${styles.rightBtText}`}>{tokenBName}</div>
                                <span className={styles.rightText}>
                                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M0.97168 1L6.20532 6L11.439 1" stroke="#AEAEAE"></path></svg>
                                </span>
                            </div> :
                            <div className={`${styles.rightContainer} + ${styles.rightBtContainer}`} onClick={() => { selectToken() }}><div style={{ height: '30px', display: 'flex', alignItems: 'center', }}></div>
                                <span className={styles.rightText}>Select A Token</span>
                            </div>}
                    </div>
                    <div className='flex justify-between'>
                        <div className={styles.inputFoot}></div>
                        {tokenBName && address ? <div className={styles.rightText}>Balance: {tokenBbanlance} </div> : ''}
                    </div>
                </div>
                <button className={styles.requestBtn} disabled={isDisabled || (tokenAAddress == '') || (tokenBAddress == '') || !address} onClick={addLiquidity}>Add liquidity</button>
            </div>
            <Modal
                open={OpenTokenA}
                title="Select A Token"
                onCancel={handleCancelTokenIn}
                footer={[
                ]}
            >
                <div className={styles.xbody}>
                    <div className='flex justify-between'>
                        <Input className={styles.customTokenInput} value={tokenAAddress} onChange={tokenInChange} onPressEnter={tokenInEnter} />
                        <div className={styles.selectToken}>{TokenAName ? TokenAName : '?'}</div>
                    </div>
                </div>
            </Modal>
            <Modal
                open={OpenTokenB}
                title="Select a token"
                onCancel={handleCancelTokenOut}
                footer={[

                ]}
            >
                <div className={styles.xbody}>
                    <div className='flex justify-between'>
                        <Input className={styles.customTokenInput} value={tokenBAddress} onChange={tokenOutChange} onPressEnter={tokenOutEnter} />
                        <div className={styles.selectToken}>{tokenBName ? tokenBName : '?'}</div>
                    </div>
                </div>
            </Modal>
            <Spin
                spinning={spinning}
                fullscreen
                indicator={
                    <LoadingOutlined
                        style={{
                            fontSize: 32,
                            color: '#ffffff',
                            fontFamily: 'PressStart2P'
                        }}
                        spin
                    />} />
        </div>
    )
}

export default lip