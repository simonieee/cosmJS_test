import {
  IndexedTx,
  SigningStargateClient,
  StargateClient,
} from "@cosmjs/stargate";
import {
  DirectSecp256k1Wallet,
  OfflineDirectSigner,
} from "@cosmjs/proto-signing";
import { fromHex } from "@cosmjs/encoding";
import { readFile } from "fs/promises";
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";

//local 연결
const rpc = "http://127.0.0.1:26657";

// 계정 주소저장
const faucet: string = "cosmos1dxvxyfvt4qr8k0n0fjam8r74tf4rm9tuhzgctf";

// private key 가져오기
const getSignerFromPriKey = async (): Promise<OfflineDirectSigner> => {
  return DirectSecp256k1Wallet.fromKey(
    fromHex((await readFile("./local.simon.private.key")).toString()),
    "cosmos"
  );
};

// Balance 조회
const getBalance = async (): Promise<void> => {
  const client = await StargateClient.connect(rpc);
  const balance = await client.getAllBalances(
    "cosmos1j72paa299nvke22memsvhdrqqfwf4xlnukk8as"
  );
  console.log("simon Balance:", balance);
};

// 서명 후 송금 트랜잭션 발생
const Signer = async (): Promise<void> => {
  const client = await StargateClient.connect(rpc);
  const simonSigner: OfflineDirectSigner = await getSignerFromPriKey();
  const simon = (await simonSigner.getAccounts())[0].address;
  console.log("simon's address from signer", simon);

  const signingClient = await SigningStargateClient.connectWithSigner(
    rpc,
    simonSigner
  );

  // 송금 전 잔액확인
  console.log("simon balance before:", await client.getAllBalances(simon));
  console.log("Faucet balance before:", await client.getAllBalances(faucet));
  // sendTransaction 결과 저장
  const result = await signingClient.sendTokens(
    simon,
    faucet,
    [{ denom: "stake", amount: "100000" }],
    {
      amount: [{ denom: "stake", amount: "500" }],
      gas: "200000",
    }
  );
  console.log("Transfer result:", result);
  console.log("simon balance after:", await client.getAllBalances(simon));
  console.log("Faucet balance after:", await client.getAllBalances(faucet));
};

const getTx = async (): Promise<void> => {
  const client = await StargateClient.connect(rpc);
  const tx: IndexedTx = (await client.getTx(
    "73D35B907380A08B2AC68C2607DE16D005CE900BF744A86B8A403D2CDA284E11"
  ))!;
  console.log("transaction:", tx);
};

const runAll = async (): Promise<void> => {
  const client = await StargateClient.connect(rpc);

  const simonSigner: OfflineDirectSigner = await getSignerFromPriKey();
  const simon = (await simonSigner.getAccounts())[0].address;
  console.log("simon's address from signer", simon);

  const signingClient = await SigningStargateClient.connectWithSigner(
    rpc,
    simonSigner
  );
  console.log(
    "With signing client, chain id:",
    await signingClient.getChainId(),
    ", height:",
    await signingClient.getHeight()
  );

  // Check the balance of Alice and the Faucet
  console.log("Alice balance before:", await client.getAllBalances(simon));
  console.log("Faucet balance before:", await client.getAllBalances(faucet));
  // Execute the sendTokens Tx and store the result
  const result = await signingClient.sendTokens(
    simon,
    faucet,
    [{ denom: "stake", amount: "100000" }],
    {
      amount: [{ denom: "stake", amount: "500" }],
      gas: "200000",
    }
  );
  // Output the result of the Tx
  console.log("Transfer result:", result);

  //transaction
  const faucetTx: IndexedTx = (await client.getTx(
    "D0A667246B148836FF2E397B09E066035F885656688D907ACF1587651C06300B"
  ))!;
  console.log("Faucet Tx:", faucetTx);

  const decodedTx: Tx = Tx.decode(faucetTx.tx);
  console.log("DecodedTx:", decodedTx);
  console.log("Decoded messages:", decodedTx.body!.messages);
  const sendMessage: MsgSend = MsgSend.decode(
    decodedTx.body!.messages[0].value
  );
  console.log("Sent message:", sendMessage);
};

getTx();
