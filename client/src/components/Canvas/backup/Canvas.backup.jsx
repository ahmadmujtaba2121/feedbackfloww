import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DrawingRenderer from './DrawingRenderer';
import TextEditor from './TextEditor';
import { auth } from '../../../firebase/firebase'; 