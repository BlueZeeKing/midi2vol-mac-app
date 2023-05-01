import {
  VStack,
  Heading,
  Input,
  FormLabel,
  Select,
  Spinner,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  AlertTitle,
  Box,
  IconButton,
  Tooltip,
  Link,
  useColorMode,
  HStack,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import {
  ExternalLinkIcon,
  RepeatIcon,
  SunIcon,
  MoonIcon,
} from "@chakra-ui/icons";

interface Settings {
  vol_sample_time: number;
  midi_devices: string[];
  channel: number;
  cc_num: number;
}

export default function App() {
  const [data, setData] = useState<Settings | null>(null);

  useEffect(() => {
    invoke("get_settings").then((raw_data) => {
      const data = raw_data as Settings;
      setData(data);
      setSpeed(data.vol_sample_time.toString());
      setChannel(data.channel.toString());
      setCC(data.cc_num.toString());
    });

    invoke("get_error").then((error) => {
      console.log(error);
      setStatus(error as string | null);
    });
  }, []);

  const [speed, setSpeed] = useState("");
  const [source, setSource] = useState(0);

  const [channel, setChannel] = useState("");
  const [cc, setCC] = useState("");

  const [status, setStatus] = useState<string | null | undefined>(undefined);

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <>
      <div
        data-tauri-drag-region
        style={{ height: "30px", width: "100%" }}
      ></div>
      <VStack p="2" gap="4">
        <Heading textAlign="center" p="8" w="100%" pt="4">
          Settings
        </Heading>
        {data ? (
          <Inputs
            speed={speed}
            options={data.midi_devices}
            onSpeedChange={setSpeed}
            source={source}
            onSourceChange={setSource}
            channel={channel}
            onChannelChange={setChannel}
            cc={cc}
            onCcChange={setCC}
          />
        ) : (
          <Spinner />
        )}
        <Button
          colorScheme="blue"
          onClick={() => {
            invoke("set_settings", {
              deviceIndex: source,
              sampleTime: parseInt(speed),
              channel: parseInt(channel),
              ccNum: parseInt(cc),
            }).then((e) => setStatus(e as string | null));
            setStatus(undefined);
          }}
        >
          Save
        </Button>
        <Tooltip
          label="https://support.apple.com/guide/mac-help/open-items-automatically-when-you-log-in-mh15189/mac"
          openDelay={600}
        >
          <Link href="https://support.apple.com/guide/mac-help/open-items-automatically-when-you-log-in-mh15189/mac">
            How to set up launch at login
            <ExternalLinkIcon mx="2" />
          </Link>
        </Tooltip>
      </VStack>
      <Box position="absolute" bottom="0" right="0" p="2">
        <Tooltip label="Toggle color mode">
          <IconButton
            colorScheme={colorMode == "dark" ? "whiteAlpha" : "blackAlpha"}
            icon={
              colorMode == "dark" ? (
                <SunIcon color="white" />
              ) : (
                <MoonIcon color="black" />
              )
            }
            aria-label="Toggle color mode"
            onClick={toggleColorMode}
          />
        </Tooltip>
      </Box>
      <Box p="4" position="absolute" bottom="0" left="0">
        {status != undefined ? (
          status == null ? (
            <Alert status="success" shadow="base" rounded="base">
              <AlertIcon />
              <AlertTitle>The MIDI client is running</AlertTitle>
            </Alert>
          ) : (
            <Alert status="error" shadow="base" rounded="base">
              <AlertIcon />
              <AlertTitle>The MIDI client has failed</AlertTitle>
              <AlertDescription>{status}</AlertDescription>
              <Tooltip label="Attempt Restart">
                <IconButton
                  colorScheme="red"
                  variant="ghost"
                  mx="2"
                  icon={<RepeatIcon />}
                  aria-label="Attempt Restart"
                  onClick={() => {
                    setStatus(undefined);
                    invoke("attempt_restart").then((e) =>
                      setStatus(e as string | null)
                    );
                  }}
                />
              </Tooltip>
            </Alert>
          )
        ) : (
          <Spinner />
        )}
      </Box>
    </>
  );
}

function Inputs(props: {
  speed: string;
  onSpeedChange: (speed: string) => void;
  source: number;
  onSourceChange: (source: number) => void;
  options: string[];
  channel: string;
  onChannelChange: (speed: string) => void;
  cc: string;
  onCcChange: (speed: string) => void;
}) {
  return (
    <>
      <FormLabel w="65%" key="vol">
        Volume Sample Rate (milliseconds)
        <Input
          value={props.speed}
          onChange={(e) => props.onSpeedChange(e.target.value)}
          type="number"
        />
      </FormLabel>
      <FormLabel w="65%" key="source">
        MIDI Input
        <Select
          onChange={(e) => props.onSourceChange(parseInt(e.target.value))}
        >
          {props.options.map((item, index) => (
            <option key={index} value={index}>
              {item}
            </option>
          ))}
        </Select>
      </FormLabel>
      <HStack w="65%">
        <FormLabel key="channel">
          MIDI Channel
          <Input
            value={props.channel}
            onChange={(e) => props.onChannelChange(e.target.value)}
            type="number"
          />
        </FormLabel>
        <FormLabel key="cc">
          CC Number
          <Input
            value={props.cc}
            onChange={(e) => props.onCcChange(e.target.value)}
            type="number"
          />
        </FormLabel>
      </HStack>
    </>
  );
}
