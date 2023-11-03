import {
    Box,
    Button,
    Container,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import {Delete} from "@mui/icons-material";
import {createRef, useEffect, useRef, useState} from "react";
import PropTypes from "prop-types";

function ImageTabPanel(props) {
    const {children, value, index, word, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tab-panel-${word}-${index}`}
            aria-labelledby={`tab-${word}-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 3}}>
                    {children}
                </Box>
            )}
        </div>
    );
}

ImageTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    word: PropTypes.string.isRequired
};

function ImageTabContent({word, images}) {
    const [value, setValue] = useState(0);

    function handleChange(event, newValue) {
        setValue(newValue);
    }

    return (
        <>
            <Typography variant={"h4"}>{word}</Typography>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" word={word}>
                    <Tab label="Image 1" tabIndex={0} id={`tab-${word}-1`} aria-controls={`tab-panel-${word}-1`}/>
                    <Tab label="Image 2" tabIndex={1} id={`tab-${word}-2`} aria-controls={`tab-panel-${word}-2`}/>
                </Tabs>
            </Box>
            <ImageTabPanel value={value} index={0} word={word}>
                <img src={images[0]} alt={"some text"}></img>
            </ImageTabPanel>
            <ImageTabPanel value={value} index={1} word={word}>
                <img src={images[1]} alt={"some text"}></img>
            </ImageTabPanel>
        </>
    )
}

function ImagesContainer({wordList}) {
    const [images, setImages] = useState({});

    useEffect(() => {
        fetch("http://127.0.0.1:5000/api/request_images", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                word: wordList
            })
        }).then(async (response) => {
            setImages(await response.json());
        }).catch((error) => {
            console.log(error);
            alert("Error occurred while fetching images");
        })
    }, [wordList]);

    return Object.keys(images).map((word) => {
        return <>
            <ImageTabContent word={word} images={images[word]}/>
        </>
    })
}

function WordList({setImagesContainer}) {
    const [wordList, setWordList] = useState([]);
    const textFieldRef = useRef(null);

    function addWord() {
        const word = textFieldRef.current.value;
        if (wordList.includes(word) || word.replaceAll(" ", "") === "") {
            textFieldRef.current.value = "";
            return;
        }
        setWordList([...wordList, word]);
        textFieldRef.current.value = "";
    }


    return (
        <>
            <Typography variant={"h4"}>
                Word List
            </Typography>
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", marginTop: "0.75rem"}}>
                <TextField id="outlined-basic" label="Enter a word" variant="outlined"
                           style={{display: "inline-block"}} color={"success"} fullWidth={true}
                           inputRef={textFieldRef}/>
                <Button
                    variant={"contained"}
                    color={"success"}
                    style={{display: "inline-block", marginLeft: "10px"}}
                    onClick={addWord}
                >
                    Add
                </Button>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.2rem"}}>
                <Button
                    variant={"contained"}
                    color={"info"}
                    style={{display: "inline-block"}}
                    onClick={() => {
                        setImagesContainer(<ImagesContainer wordList={wordList}/>)
                    }}>
                    search images
                </Button>
                <Button variant={"contained"} color={"error"} onClick={() => setWordList([])}><Delete/></Button>
            </div>
            <Box sx={{flexGrow: 1, maxWidth: 752}}>
                <Grid item xs={12} md={6}>
                    <div>
                        <List dense={true}>
                            {wordList.map((word) => {
                                const textRef = createRef();

                                function removeWord() {
                                    const word = textRef.current.innerText;
                                    setWordList(wordList.filter((w) => w !== word));
                                }

                                return (
                                    <ListItem
                                        secondaryAction={
                                            <IconButton edge="end" aria-label="delete" onClick={removeWord}>
                                                <Delete/>
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText ref={textRef} primary={word}/>
                                    </ListItem>
                                )
                            })}
                        </List>
                    </div>
                </Grid>
            </Box>
        </>
    )
}


export default function SearchPage() {
    /** @type {[React.ReactNode, Function]} */
    const [imagesContainer, setImagesContainer] = useState(<></>);
    return (
        <Container style={{marginTop: "0.7rem"}}>
            <WordList setImagesContainer={setImagesContainer}/>
            {imagesContainer}
        </Container>
    )
}
