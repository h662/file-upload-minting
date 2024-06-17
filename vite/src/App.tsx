import { Button, Flex, Text } from "@chakra-ui/react";
import { Contract, ethers } from "ethers";
import { JsonRpcSigner } from "ethers";
import { ChangeEvent, FC, useEffect, useState } from "react";
import mintNftAbi from "./mintNftAbi.json";
import axios from "axios";

const App: FC = () => {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  const onClickMetamask = async () => {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);

      setSigner(await provider.getSigner());
    } catch (error) {
      console.error(error);
    }
  };

  const uploadImage = async (formData: FormData) => {
    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: import.meta.env.VITE_PINATA_KEY,
            pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET,
          },
        }
      );

      return `https://slime-project.mypinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error(error);
    }
  };

  const uploadMetadata = async (image: string) => {
    try {
      const metadata = JSON.stringify({
        pinataContent: {
          name: "Test",
          description: "Test",
          image,
        },
        pinataMetadata: {
          name: "test.json",
        },
      });

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: import.meta.env.VITE_PINATA_KEY,
            pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET,
          },
        }
      );

      return `https://slime-project.mypinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error(error);
    }
  };

  const onChangeFile = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.currentTarget.files || !contract) return;

      const formData = new FormData();

      formData.append("file", e.currentTarget.files[0]);

      const imageUrl = await uploadImage(formData);

      const metadataUrl = await uploadMetadata(imageUrl!);

      const tx = await contract.mintNft(metadataUrl);

      await tx.wait();

      console.log(tx);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!signer) return;

    setContract(
      new Contract(
        "0xcBD0eC628C2bbdE0D0FA4a79BFf1280b8007267c",
        mintNftAbi,
        signer
      )
    );
  }, [signer]);

  return (
    <Flex
      bgColor="red.100"
      w="100%"
      minH="100vh"
      justifyContent="center"
      alignItems="center"
      flexDir="column"
    >
      {signer ? (
        <>
          <Text>{signer.address}</Text>
          <input
            style={{ display: "none" }}
            id="file"
            type="file"
            onChange={onChangeFile}
          />
          <label htmlFor="file">
            <Text>민팅</Text>
          </label>
        </>
      ) : (
        <Button onClick={onClickMetamask}>🦊 로그인</Button>
      )}
    </Flex>
  );
};

export default App;
