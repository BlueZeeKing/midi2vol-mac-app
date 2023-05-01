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
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { TbReload } from "react-icons/tb";

interface Settings {
  vol_sample_time: number;
  midi_devices: string[];
}

export default function App() {
  const [data, setData] = useState<Settings | null>(null);

  useEffect(() => {
    invoke("get_settings").then((raw_data) => {
      const data = raw_data as Settings;
      setData(data);
      setSpeed(data.vol_sample_time.toString());
    });

    invoke("get_error").then((error) => {
      console.log(error);
      setStatus(error as string | null);
    });
  }, []);

  const [speed, setSpeed] = useState("");
  const [source, setSource] = useState(0);

  const [status, setStatus] = useState<string | null | undefined>(undefined);

  return (
    <>
      <div
        data-tauri-drag-region
        style={{ height: "30px", width: "100%" }}
      ></div>
      <VStack p="2" gap="4">
        <Heading textAlign="center" p="8" w="100%">
          Settings
        </Heading>
        {data ? (
          <Inputs
            speed={speed}
            options={data.midi_devices}
            onSpeedChange={setSpeed}
            source={source}
            onSourceChange={setSource}
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
            });
          }}
        >
          Save
        </Button>
      </VStack>
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
                  icon={<TbReload />}
                  aria-label="Attempt Restart"
                  onClick={() => {
                    setStatus(undefined);
                    invoke("attempt_restart").then((e) => setStatus(e));
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
}) {
  return (
    <>
      <FormLabel w="65%" key="vol">
        Volume Sample Rate (milliseconds)
        <Input
          value={props.speed}
          onChange={(e) => props.onSpeedChange(e.target.value)}
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
    </>
  );
}
