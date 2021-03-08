import express from "express";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import { signupUser, loginUser } from "./validations/user";
import getUserId, { generateAuthToken, hashPassword } from "./utils/user";

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.json());

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  await loginUser.validateAsync(
    { email, password },
    {
      abortEarly: false,
    }
  );

  const user = await prisma.user.findOne({ email });

  if (!user) {
    throw new Error("A User with this Email doesn't exist");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Incorrect Password!");
  }

  const { password: _, ...dbUser } = user.toJSON();

  const authToken = generateAuthToken(dbUser);

  res.json({
    token: `Bearer ${authToken}`,
    user: dbUser,
  });
});

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  await signupUser.validateAsync(
    { email, password, name },
    { abortEarly: false }
  );

  const user = await prisma.user.findOne({ email });

  if (user) {
    throw new Error("A User with this Email already exists");
  }

  const hashedPassword = hashPassword(password);

  const result = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  return {
    message: "User has been successfully registered",
  };
});

app.post(`/user`, async (req, res) => {
  const result = await prisma.user.create({
    data: {
      ...req.body,
    },
  });
  res.json(result);
});

app.post(`/post`, async (req, res) => {
  const { title, content, authorEmail } = req.body;
  const result = await prisma.post.create({
    data: {
      title,
      content,
      published: false,
      author: { connect: { email: authorEmail } },
    },
  });
  res.json(result);
});

app.put("/publish/:id", async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.update({
    where: {
      id: parseInt(id),
    },
    data: { published: true },
  });
  res.json(post);
});

app.delete(`/post/:id`, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json(post);
});

app.get(`/post/:id`, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  res.json(post);
});

app.get("/feed", async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: { author: true },
  });
  res.json(posts);
});

app.get("/filterPosts", async (req, res) => {
  const { searchString } = req.query;
  const draftPosts = await prisma.post.findMany({
    where: {
      OR: [
        {
          title: {
            contains: searchString,
          },
        },
        {
          content: {
            contains: searchString,
          },
        },
      ],
    },
  });
  res.json(draftPosts);
});

const server = app.listen(3000, () =>
  console.log("🚀 Server ready at: http://localhost:3000")
);
